#!/usr/bin/env bash
# ------------------------------------------------------------------
# test-registry-install.sh
#
# Integration test that verifies our shadcn registry components can be
# installed into a fresh Next.js project and compile successfully.
#
# Steps:
#   1. Build the source app to verify it compiles cleanly
#   2. Build the registry JSON files
#   3. Scaffold a fresh Next.js app with create-next-app
#   4. Init shadcn and install every registry component via `shadcn add`
#   5. Fix cross-component imports (file-based installs can't resolve
#      registryDependencies, so paths need post-processing)
#   6. Create a smoke-test page that imports all components
#   7. Build the fresh app (typecheck + compile)
# ------------------------------------------------------------------
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
REGISTRY_DIR="${REPO_ROOT}/public/r"

cleanup() {
  echo ""
  echo "Cleaning up..."
  rm -rf "${TEST_DIR}"
  echo "Done."
}
trap cleanup EXIT

# Retry a network-dependent command (max 3 attempts, linear backoff). The fresh
# install reaches external services — the npm registry, create-next-app, and
# ui.shadcn.com during `shadcn init` — which occasionally drop the connection
# mid-handshake. A transient TLS/socket failure shouldn't fail the whole job.
retry() {
  local max=3 n=1 status
  while true; do
    status=0
    "$@" || status=$?
    if (( status == 0 )); then
      return 0
    fi
    if (( n >= max )); then
      echo "   ✗ '$*' failed after ${max} attempts (exit ${status})." >&2
      return "${status}"
    fi
    echo "   ⚠ '$*' failed (exit ${status}); retry ${n}/${max} in $((n * 5))s..." >&2
    sleep $(( n * 5 ))
    n=$(( n + 1 ))
  done
}

# ── 1. Build the source app ──────────────────────────────────────
echo "── Step 1: Building source app to verify it compiles cleanly..."
cd "${REPO_ROOT}"
pnpm build
echo "   Source app builds OK."

# ── 2. Build the registry ────────────────────────────────────────
echo ""
echo "── Step 2: Building registry..."
pnpm registry:build
echo "   Registry built. Files in public/r/:"
ls public/r/

# ── 3. Scaffold a fresh Next.js app ─────────────────────────────
echo ""
echo "── Step 3: Scaffolding fresh Next.js app..."
cd "${TEST_DIR}"

# Pipe newline to accept any interactive prompts (e.g. React Compiler).
# Wrapped in retry: create-next-app fetches packages over the network and can
# hit transient socket drops; rm -rf keeps each attempt starting from a clean dir.
scaffold_app() {
  rm -rf test-app
  printf '\n' | npx --yes create-next-app@latest test-app \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --use-pnpm \
    --no-turbopack \
    --no-git
}
retry scaffold_app
cd test-app
echo "   App created at ${TEST_DIR}/test-app"

# ── 4. Init shadcn and install registry components ───────────────
echo ""
echo "── Step 4: Initializing shadcn..."
retry pnpm dlx shadcn@latest init --yes --defaults

echo ""
echo "── Step 5: Installing registry components..."

COMPONENTS=("prompt-area" "action-bar" "status-bar")

for component in "${COMPONENTS[@]}"; do
  echo "   Installing ${component}..."
  retry pnpm dlx shadcn@latest add "${REGISTRY_DIR}/${component}.json" --yes --overwrite
  echo "   Done: ${component}"
done

# compact-prompt-area has registryDependencies: ["prompt-area"] which shadcn
# cannot resolve from a file path (only works with URL-based registries).
# Since prompt-area is already installed, we strip the dependency and install
# from a patched copy.
echo "   Installing compact-prompt-area..."
PATCHED_JSON="${TEST_DIR}/compact-prompt-area-patched.json"
python3 -c "
import json
with open('${REGISTRY_DIR}/compact-prompt-area.json') as f:
    data = json.load(f)
data['registryDependencies'] = []
with open('${PATCHED_JSON}', 'w') as f:
    json.dump(data, f)
"
retry pnpm dlx shadcn@latest add "${PATCHED_JSON}" --yes --overwrite
echo "   Done: compact-prompt-area"

# Install peer dependencies the components need
echo ""
echo "   Installing peer dependencies (lucide-react, framer-motion)..."
retry pnpm add lucide-react framer-motion

# ── 5. Verify installed files ────────────────────────────────────
echo ""
echo "── Step 6: Verifying installed component files..."

EXPECTED_FILES=(
  "src/components/prompt-area.tsx"
  "src/components/trigger-popover.tsx"
  "src/components/use-prompt-area.ts"
  "src/components/use-prompt-area-events.ts"
  "src/components/prompt-area-engine.ts"
  "src/components/dom-helpers.ts"
  "src/components/use-trigger-search.ts"
  "src/components/types.ts"
  "src/components/animated-placeholder.tsx"
  "src/components/image-strip.tsx"
  "src/components/file-strip.tsx"
  "src/components/remove-button.tsx"
  "src/components/segment-helpers.ts"
  "src/components/trigger-presets.ts"
  "src/components/use-prompt-area-state.ts"
  "src/components/action-bar.tsx"
  "src/components/status-bar.tsx"
  "src/components/compact-prompt-area.tsx"
)

for file in "${EXPECTED_FILES[@]}"; do
  if [[ -f "${file}" ]]; then
    echo "   OK: ${file}"
  else
    echo "   MISSING: ${file}"
    exit 1
  fi
done

# ── 6. Fix post-install issues ───────────────────────────────────
# File-based installs have two known issues:
#   a) shadcn overwrites types.ts when multiple components share that filename
#   b) Cross-component @/registry/ imports are not rewritten correctly
echo ""
echo "── Step 7: Fixing post-install issues..."

# a) Rebuild types.ts by extracting and merging types from all registry JSONs.
#    Each component's types.ts gets overwritten by the next install, so we
#    reconstruct the complete file from the registry source.
python3 << MERGETYPES
import json, os, re

registry_dir = "${REGISTRY_DIR}"
components = ["prompt-area", "action-bar", "status-bar", "compact-prompt-area"]
merged = []

for comp in components:
    path = os.path.join(registry_dir, f"{comp}.json")
    with open(path) as f:
        data = json.load(f)
    for file_entry in data.get("files", []):
        if file_entry["path"].endswith("/types.ts"):
            content = file_entry["content"]
            # Remove imports from sibling type files (they'll be in this file)
            content = re.sub(
                r"import type \{[^}]*\} from '[^']*types'\n*",
                "",
                content,
            )
            merged.append(f"// -- {comp} types --")
            merged.append(content.strip())
            break

with open("src/components/types.ts", "w") as f:
    f.write("\n\n".join(merged) + "\n")

print("   types.ts rebuilt from registry sources")
MERGETYPES

# b) Fix compact-prompt-area.tsx: @/components/blocks/prompt-area/X → ./X
sed -i "s|from '@/components/blocks/prompt-area/\([^']*\)'|from './\1'|g" \
  src/components/compact-prompt-area.tsx

echo "   Cross-component imports fixed"

# Replace Google Fonts with system fonts to avoid network dependency in CI
cat > src/app/layout.tsx << 'LAYOUT_EOF'
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Registry Smoke Test",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
LAYOUT_EOF
echo "   Layout updated to use system fonts"

# ── 7. Create a smoke-test page ──────────────────────────────────
echo ""
echo "── Step 8: Creating smoke-test page..."
mkdir -p src/app/smoke-test

cat > src/app/smoke-test/page.tsx << 'SMOKE_EOF'
"use client"

import { useState } from "react"
import { PromptArea } from "@/components/prompt-area"
import type { Segment } from "@/components/types"
import { ActionBar } from "@/components/action-bar"
import { StatusBar } from "@/components/status-bar"
import { CompactPromptArea } from "@/components/compact-prompt-area"

export default function SmokeTest() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [compactSegments, setCompactSegments] = useState<Segment[]>([])

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">Registry Smoke Test</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">PromptArea</h2>
        <StatusBar left={<span>Status: Ready</span>} />
        <PromptArea
          value={segments}
          onChange={setSegments}
          placeholder="Type here..."
          onSubmit={() => setSegments([])}
        />
        <ActionBar
          left={<span>Left slot</span>}
          right={<button type="button">Send</button>}
        />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">CompactPromptArea</h2>
        <CompactPromptArea
          value={compactSegments}
          onChange={setCompactSegments}
          placeholder="Compact input..."
          onSubmit={() => setCompactSegments([])}
        />
      </section>
    </div>
  )
}
SMOKE_EOF
echo "   Smoke-test page created"

# ── 8. Build the app ─────────────────────────────────────────────
echo ""
echo "── Step 9: Building the test app..."
pnpm build 2>&1

echo ""
echo "========================================================"
echo "  All registry components installed and built OK!"
echo "========================================================"
