#!/usr/bin/env bash
# ------------------------------------------------------------------
# test-registry-install.sh
#
# Integration test that verifies our shadcn registry components can be
# installed into a fresh Next.js project and compile successfully.
#
# Steps:
#   1. Build the registry JSON files
#   2. Scaffold a fresh Next.js app with create-next-app
#   3. Init shadcn and install every registry component via `shadcn add`
#   4. Fix cross-component imports (file-based installs can't resolve
#      registryDependencies, so paths need post-processing)
#   5. Create a smoke-test page that imports all components
#   6. Build the fresh app (typecheck + compile)
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

# ── 1. Build the registry ────────────────────────────────────────
echo "── Step 1: Building registry..."
cd "${REPO_ROOT}"
pnpm registry:build
echo "   Registry built. Files in public/r/:"
ls public/r/

# ── 2. Scaffold a fresh Next.js app ─────────────────────────────
echo ""
echo "── Step 2: Scaffolding fresh Next.js app..."
cd "${TEST_DIR}"

# Pipe newline to accept any interactive prompts (e.g. React Compiler)
printf '\n' | npx --yes create-next-app@latest test-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --no-turbopack \
  --no-git \
  2>&1 | tail -5
cd test-app
echo "   App created at ${TEST_DIR}/test-app"

# ── 3. Init shadcn and install registry components ───────────────
echo ""
echo "── Step 3: Initializing shadcn..."
pnpm dlx shadcn@latest init --yes --defaults 2>&1 | tail -5

echo ""
echo "── Step 4: Installing registry components..."

COMPONENTS=("prompt-area" "action-bar" "status-bar")

for component in "${COMPONENTS[@]}"; do
  echo "   Installing ${component}..."
  pnpm dlx shadcn@latest add "${REGISTRY_DIR}/${component}.json" --yes --overwrite 2>&1 | tail -3
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
pnpm dlx shadcn@latest add "${PATCHED_JSON}" --yes --overwrite 2>&1 | tail -3
echo "   Done: compact-prompt-area"

# Install peer dependencies the components need
echo ""
echo "   Installing peer dependencies (lucide-react, framer-motion)..."
pnpm add lucide-react framer-motion 2>&1 | tail -3

# ── 4. Verify installed files ────────────────────────────────────
echo ""
echo "── Step 5: Verifying installed component files..."

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

# ── 5. Fix post-install issues ───────────────────────────────────
# File-based installs have two known issues:
#   a) shadcn overwrites types.ts when multiple components share that filename
#   b) Cross-component @/registry/ imports are not rewritten correctly
echo ""
echo "── Step 6: Fixing post-install issues..."

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

# ── 6. Create a smoke-test page ──────────────────────────────────
echo ""
echo "── Step 7: Creating smoke-test page..."
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

# ── 7. Build the app ─────────────────────────────────────────────
echo ""
echo "── Step 8: Building the test app..."
pnpm build 2>&1

echo ""
echo "========================================================"
echo "  All registry components installed and built OK!"
echo "========================================================"
