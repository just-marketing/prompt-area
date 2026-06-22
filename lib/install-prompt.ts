/**
 * Canonical "install with an AI coding agent" prompt.
 *
 * Users copy this into Claude Code, Cursor, Codex, etc. and the agent does the
 * full Prompt Area integration for them: it reads the machine-readable docs at
 * /llms-full.txt, installs the component (npm by default, or the shadcn
 * registry when the project uses shadcn and the user asks for it), and wires it
 * into the app — replacing any existing chat input or scaffolding a new one.
 *
 * This is the single source of truth so the homepage install tabs and the docs
 * Installation page stay in sync. The README mirrors this text by hand.
 */
export const INSTALL_PROMPT = `Install Prompt Area — a production-grade React chat/prompt input (@mentions, /commands, #tags, inline markdown, file attachments) — into this project. Do the full integration yourself; don't just print instructions.

1. Read the docs first. Fetch https://prompt-area.com/llms-full.txt and read it in full. It is the source of truth for the API, props, triggers, helpers, and required CSS — use it, don't guess.

2. Choose how to install, and default to the npm package:
   - npm (default): install prompt-area with the project's package manager, then import { PromptArea } from 'prompt-area' and import 'prompt-area/styles.css' once at the app root. No Tailwind required.
   - shadcn: only if this project already uses shadcn/ui (a components.json exists) AND I explicitly ask for it — run npx shadcn@latest add https://prompt-area.com/r/prompt-area.json, then add the .prompt-area-* component classes from the docs to globals.css.
   If it is ambiguous, ask me once which I want; otherwise use npm.

3. Wire it into the app. If a chat/prompt composer (or a <textarea> used as one) already exists, replace it with PromptArea, keeping the existing submit, placeholder, and send/attach controls, and connect @mentions, /commands, or #tags to real project data when it is obvious (otherwise leave a clearly marked stub). If there is no composer yet, scaffold a minimal working one from the Quick Start — controlled state via usePromptAreaState and an onSubmit that sends the plain text.

4. Verify your work. Make sure the project typechecks and builds, fix any import or CSS wiring, then show me the final component and how to run it.`
