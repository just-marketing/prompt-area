// ---------------------------------------------------------------------------
// Blog content.
//
// Posts are authored as a small set of typed content blocks so the index,
// renderer, sitemap, and JSON-LD all read from one source of truth — no MDX
// toolchain or extra dependencies required.
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://prompt-area.com'

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'code'; code: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; text: string }

export interface PostFaq {
  question: string
  answer: string
}

export interface RelatedLink {
  href: string
  label: string
}

export interface Post {
  slug: string
  title: string
  description: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  readingMinutes: number
  keywords: string[]
  excerpt: string
  blocks: Block[]
  faq?: PostFaq[]
  related?: RelatedLink[]
}

const INSTALL = 'npx shadcn@latest add https://prompt-area.com/r/prompt-area.json'

export const POSTS: Post[] = [
  {
    slug: 'build-ai-chat-textarea-react-mentions',
    title: 'How to Build an AI Chat Textarea in React with @Mentions',
    description:
      'A practical guide to building a modern AI chat input in React — with @mentions, /commands, and structured output — using a zero-dependency shadcn component instead of a heavy editor framework.',
    date: '2026-06-14',
    readingMinutes: 8,
    keywords: [
      'AI chat textarea react',
      'react chat input',
      'react textarea mentions',
      'how to build AI chat input react',
      'shadcn chat input',
    ],
    excerpt:
      'Modern AI apps need a chat input that does more than hold text — @mentions, /commands, attachments, and clean structured output. Here is how to build one in React without dragging in a full editor framework.',
    blocks: [
      {
        type: 'p',
        text: 'Every AI app eventually needs the same thing: a good chat input. Not a plain <textarea>, but a composer where users can @mention context, run /commands, attach files, and where you get clean structured data back to send to your model. The usual options are heavyweight — ProseMirror or Slate-based editors built for documents, not chat.',
      },
      {
        type: 'p',
        text: 'This guide builds a production-grade AI chat textarea in React using Prompt Area, a zero-dependency component distributed through the shadcn registry. You install the source into your project, so there is no black-box dependency to fight.',
      },
      { type: 'h2', text: 'What we are building' },
      {
        type: 'ul',
        items: [
          'An auto-growing chat input that feels like ChatGPT or Claude',
          '@mentions for users, agents, or documents with a dropdown',
          '/commands for actions like summarize or deep-research',
          'Structured output you can send straight to an LLM',
        ],
      },
      { type: 'h2', text: 'Step 1 — Install the component' },
      {
        type: 'p',
        text: 'Prompt Area installs through the shadcn registry. One command copies the component, its types, helpers, and the segment engine into your project:',
      },
      { type: 'code', code: INSTALL },
      {
        type: 'p',
        text: 'Because it is a registry component, the source lives in your repo. There are no extra runtime dependencies beyond React.',
      },
      { type: 'h2', text: 'Step 2 — Render the input with state' },
      {
        type: 'p',
        text: 'The usePromptAreaState() hook manages the editor value and exposes derived state (plainText, isEmpty, chips). Spread its bind onto the component and you have a working input:',
      },
      {
        type: 'code',
        code: `'use client'

import { PromptArea } from '@/components/prompt-area/prompt-area'
import { usePromptAreaState } from '@/components/prompt-area/use-prompt-area-state'

export function ChatInput() {
  const { bind, plainText, isEmpty, clear } = usePromptAreaState()

  function handleSubmit() {
    if (isEmpty) return
    sendToModel(plainText) // your LLM call
    clear()
  }

  return (
    <PromptArea
      {...bind}
      placeholder="Ask anything…"
      onSubmit={handleSubmit}
      minHeight={48}
    />
  )
}`,
      },
      { type: 'h2', text: 'Step 3 — Add @mentions' },
      {
        type: 'p',
        text: 'Mentions are just a trigger. Use the mentionTrigger() preset and give it an onSearch function that returns items as the user types. Each selection becomes an immutable chip in the input.',
      },
      {
        type: 'code',
        code: `import { mentionTrigger } from '@/components/prompt-area/trigger-presets'

const AGENTS = [
  { value: 'copywriter', label: 'Copywriter', description: 'Ad copy & content' },
  { value: 'analyst', label: 'Analyst', description: 'Performance insights' },
]

const searchAgents = (q: string) =>
  AGENTS.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()))

<PromptArea
  {...bind}
  triggers={[mentionTrigger({ onSearch: searchAgents })]}
  placeholder="Mention an @agent…"
/>`,
      },
      { type: 'h2', text: 'Step 4 — Add /commands' },
      {
        type: 'p',
        text: 'Slash commands work the same way with commandTrigger(), using start-of-line detection so a / only opens the menu at the beginning of a line.',
      },
      {
        type: 'code',
        code: `import { commandTrigger } from '@/components/prompt-area/trigger-presets'

const COMMANDS = [
  { value: 'summarize', label: 'summarize', description: 'Summarize the thread' },
  { value: 'deep-research', label: 'deep-research', description: 'Research in depth' },
]

const searchCommands = (q: string) =>
  COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))

<PromptArea
  {...bind}
  triggers={[
    mentionTrigger({ onSearch: searchAgents }),
    commandTrigger({ onSearch: searchCommands }),
  ]}
/>`,
      },
      { type: 'h2', text: 'Step 5 — Read structured data, not a string' },
      {
        type: 'p',
        text: 'This is where a chat-first component pays off. Instead of parsing a markup string, read typed chips directly with getChipsByTrigger(). You can route the data to your model however you like:',
      },
      {
        type: 'code',
        code: `import { getChipsByTrigger } from '@/components/prompt-area/segment-helpers'

const mentions = getChipsByTrigger(bind.value, '@')
const commands = getChipsByTrigger(bind.value, '/')

await runChat({
  prompt: plainText,
  agents: mentions.map((m) => m.value),
  command: commands[0]?.value,
})`,
      },
      {
        type: 'callout',
        text: 'Because every chip is a typed segment, you never have to regex your way through the input to figure out what the user referenced.',
      },
      { type: 'h2', text: 'Why not Tiptap, Lexical, or Slate?' },
      {
        type: 'p',
        text: 'Those frameworks are excellent for document editing, but for a chat input they are a lot of machinery: you assemble extensions or plugins and pull in several dependencies just to get mentions and a command menu. For an AI composer, a focused zero-dependency component gets you to the same UX faster and lighter. If you do need full document editing, that is the moment to reach for one of those frameworks.',
      },
      { type: 'h2', text: 'Wrapping up' },
      {
        type: 'p',
        text: 'In a handful of steps you have an AI chat textarea with mentions, commands, auto-grow, and structured output — ready to wire into any LLM provider or the Vercel AI SDK. From here you can add #tags, file attachments, and companion components like an Action Bar or full Chat Prompt Layout.',
      },
    ],
    faq: [
      {
        question: 'What is the best React component for an AI chat input?',
        answer:
          'Prompt Area is purpose-built for AI chat inputs: it combines @mentions, /commands, #tags, inline markdown, and file attachments in a single zero-dependency component installed via the shadcn registry, and returns structured data you can send straight to an LLM.',
      },
      {
        question: 'Do I need ProseMirror or Slate to build a chat textarea?',
        answer:
          'No. Those are document-editor frameworks. For a chat input you can use a focused contentEditable component like Prompt Area, which has no ProseMirror, Slate, or Lexical dependency.',
      },
      {
        question: 'How do I get structured data out of the chat input?',
        answer:
          'Call getChipsByTrigger(value, "@") (or "/") to read resolved mentions and commands as typed chips, and read plainText for the message body. No string parsing required.',
      },
    ],
    related: [
      { href: '/vs/tiptap', label: 'Prompt Area vs Tiptap' },
      { href: '/for-ai-apps', label: 'Prompt Area for AI & LLM apps' },
      {
        href: '/blog/add-slash-commands-react-input',
        label: 'How to add slash commands to a React input',
      },
    ],
  },
  {
    slug: 'react-mentions-alternative-migration-guide',
    title: 'A Modern react-mentions Alternative (with Migration Guide)',
    description:
      'react-mentions only does @mentions and stopped getting major updates in 2022. Here is how to migrate to Prompt Area and gain /commands, #tags, markdown, attachments, and structured output.',
    date: '2026-06-14',
    readingMinutes: 7,
    keywords: [
      'react-mentions alternative',
      'react-mentions replacement',
      'modern mentions react',
      'react mentions component',
      'migrate react-mentions',
    ],
    excerpt:
      'react-mentions has powered @mentions in React for years, but it only does mentions and its last major release was in 2022. Here is a modern alternative and a step-by-step migration.',
    blocks: [
      {
        type: 'p',
        text: 'react-mentions is still downloaded hundreds of thousands of times a week, but its scope never grew past one feature: @mentions over a textarea. If your product has moved on to AI chat — where you also want /commands, #tags, attachments, and structured output — you have likely outgrown it.',
      },
      {
        type: 'p',
        text: 'Prompt Area is a modern alternative that keeps the mentions you rely on and adds everything a chat composer needs, with zero extra dependencies. This guide covers the differences and a concrete migration path.',
      },
      { type: 'h2', text: 'What you gain' },
      {
        type: 'ul',
        items: [
          '/slash commands and #hashtag tags using the same trigger model as mentions',
          'Inline markdown, file and image attachments, and undo/redo',
          'Structured chip output instead of parsing a markup string',
          'Companion components: Action Bar, Status Bar, Compact, and Chat Prompt Layout',
          'Active maintenance and shadcn registry distribution you own',
        ],
      },
      { type: 'h2', text: 'The mental-model shift' },
      {
        type: 'p',
        text: 'react-mentions gives you a markup string you parse afterward. Prompt Area gives you typed segments. Instead of regexing "@[Name](id)" out of a string, you read chips directly. That single change removes a whole class of brittle parsing code.',
      },
      { type: 'h2', text: 'Step 1 — Install Prompt Area' },
      { type: 'code', code: INSTALL },
      { type: 'h2', text: 'Step 2 — Replace MentionsInput' },
      {
        type: 'p',
        text: 'A typical react-mentions setup looks like this:',
      },
      {
        type: 'code',
        code: `// Before — react-mentions
<MentionsInput value={value} onChange={(e) => setValue(e.target.value)}>
  <Mention trigger="@" data={users} />
</MentionsInput>`,
      },
      {
        type: 'p',
        text: 'The equivalent with Prompt Area uses the state hook and a mention trigger:',
      },
      {
        type: 'code',
        code: `// After — Prompt Area
import { PromptArea } from '@/components/prompt-area/prompt-area'
import { usePromptAreaState } from '@/components/prompt-area/use-prompt-area-state'
import { mentionTrigger } from '@/components/prompt-area/trigger-presets'

const { bind } = usePromptAreaState()
const searchUsers = (q: string) =>
  users.filter((u) => u.label.toLowerCase().includes(q.toLowerCase()))

<PromptArea {...bind} triggers={[mentionTrigger({ onSearch: searchUsers })]} />`,
      },
      { type: 'h3', text: 'Map your data shape' },
      {
        type: 'p',
        text: 'react-mentions data is usually { id, display }. Prompt Area items use { value, label, description? }. A one-line map handles the conversion:',
      },
      {
        type: 'code',
        code: `const users = rawUsers.map((u) => ({ value: u.id, label: u.display }))`,
      },
      { type: 'h2', text: 'Step 3 — Read mentions as data' },
      {
        type: 'p',
        text: 'Drop the markup parsing. Read resolved mentions directly:',
      },
      {
        type: 'code',
        code: `import { getChipsByTrigger } from '@/components/prompt-area/segment-helpers'

const mentioned = getChipsByTrigger(bind.value, '@').map((c) => c.value)`,
      },
      { type: 'h2', text: 'Step 4 — Add what react-mentions never had' },
      {
        type: 'p',
        text: 'Now that mentions work, opt into the rest by adding triggers. Commands and tags reuse the exact same pattern:',
      },
      {
        type: 'code',
        code: `import { commandTrigger, hashtagTrigger } from '@/components/prompt-area/trigger-presets'

<PromptArea
  {...bind}
  triggers={[
    mentionTrigger({ onSearch: searchUsers }),
    commandTrigger({ onSearch: searchCommands }),
    hashtagTrigger({ onSearch: searchTags }),
  ]}
/>`,
      },
      {
        type: 'callout',
        text: 'You can migrate incrementally: start with mentions to reach parity, then add commands, tags, and attachments as you need them.',
      },
      { type: 'h2', text: 'When to stay on react-mentions' },
      {
        type: 'p',
        text: 'If you genuinely only need @mentions and want the smallest possible surface area on an existing, working integration, react-mentions is fine. The case for switching is when you need more than mentions — which, for most AI products, happens fast.',
      },
    ],
    faq: [
      {
        question: 'What is the best alternative to react-mentions?',
        answer:
          'Prompt Area is the best react-mentions alternative for modern AI apps. It keeps @mentions and adds /commands, #tags, markdown, file attachments, undo/redo, and structured output, with zero extra dependencies via the shadcn registry.',
      },
      {
        question: 'Is migrating from react-mentions hard?',
        answer:
          'No. You replace MentionsInput with PromptArea, move your mention data into a mentionTrigger(), map { id, display } to { value, label }, and read mentions with getChipsByTrigger("@") instead of parsing a markup string.',
      },
      {
        question: 'Why is react-mentions considered outdated?',
        answer:
          'Its last major release was in 2022 and its scope is limited to @mentions. It has no slash commands, tags, markdown, attachments, or structured output that modern chat interfaces typically require.',
      },
    ],
    related: [
      { href: '/vs/react-mentions', label: 'Prompt Area vs react-mentions (full comparison)' },
      {
        href: '/blog/build-ai-chat-textarea-react-mentions',
        label: 'Build an AI chat textarea in React',
      },
      { href: '/compare', label: 'Compare all alternatives' },
    ],
  },
  {
    slug: 'add-slash-commands-react-input',
    title: 'How to Add Slash Commands to a React Input',
    description:
      'Build a /command menu in a React textarea — like Slack, Linear, or ChatGPT — with start-of-line detection and structured output, using a zero-dependency shadcn component.',
    date: '2026-06-14',
    readingMinutes: 6,
    keywords: [
      'react slash commands input',
      'slash command textarea react',
      'react command menu input',
      'react / command input',
      'shadcn slash commands',
    ],
    excerpt:
      'Slash commands turn a chat input into a control surface. Here is how to add a / command menu to a React textarea with start-of-line detection and clean structured output.',
    blocks: [
      {
        type: 'p',
        text: 'Slash commands are everywhere now — Slack, Linear, Notion, ChatGPT. Typing / opens a menu of actions, you pick one, and the app does something specific. They are one of the highest-leverage additions to a chat input because they let power users skip menus entirely.',
      },
      {
        type: 'p',
        text: 'This tutorial adds a / command menu to a React input using Prompt Area. You get start-of-line detection (so a / mid-sentence does not trigger the menu) and structured output, with zero extra dependencies.',
      },
      { type: 'h2', text: 'Step 1 — Install' },
      { type: 'code', code: INSTALL },
      { type: 'h2', text: 'Step 2 — Define your commands' },
      {
        type: 'p',
        text: 'Commands are plain data: a value to act on, a label to show, and an optional description for the dropdown.',
      },
      {
        type: 'code',
        code: `const COMMANDS = [
  { value: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { value: 'translate', label: 'translate', description: 'Translate the last message' },
  { value: 'deep-research', label: 'deep-research', description: 'Research a topic in depth' },
]

const searchCommands = (q: string) =>
  COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))`,
      },
      { type: 'h2', text: 'Step 3 — Wire up the command trigger' },
      {
        type: 'p',
        text: 'The commandTrigger() preset handles the / character, start-of-line detection, and the dropdown. Spread your state bind and pass the trigger:',
      },
      {
        type: 'code',
        code: `'use client'

import { PromptArea } from '@/components/prompt-area/prompt-area'
import { usePromptAreaState } from '@/components/prompt-area/use-prompt-area-state'
import { commandTrigger } from '@/components/prompt-area/trigger-presets'

export function CommandInput() {
  const { bind } = usePromptAreaState()
  return (
    <PromptArea
      {...bind}
      triggers={[commandTrigger({ onSearch: searchCommands })]}
      placeholder="Type / for commands…"
      minHeight={48}
    />
  )
}`,
      },
      { type: 'h2', text: 'Step 4 — Act on the selected command' },
      {
        type: 'p',
        text: 'When the user submits, read the chosen command as structured data and branch your logic. No parsing the raw text for a leading slash.',
      },
      {
        type: 'code',
        code: `import { getChipsByTrigger } from '@/components/prompt-area/segment-helpers'

function handleSubmit() {
  const command = getChipsByTrigger(bind.value, '/')[0]?.value
  switch (command) {
    case 'summarize':
      return summarizeThread()
    case 'translate':
      return translateLast()
    default:
      return sendMessage(plainText)
  }
}`,
      },
      {
        type: 'callout',
        text: 'Because the command is a typed chip, it stays intact even if the user keeps typing a message after it — you always know exactly which command was chosen.',
      },
      { type: 'h2', text: 'Going further' },
      {
        type: 'p',
        text: 'The same trigger system powers @mentions and #tags, so you can combine them in one input. You can also style command chips, load commands asynchronously via onSearch, and pair the input with an Action Bar for buttons like attach and send.',
      },
    ],
    faq: [
      {
        question: 'How do I add slash commands to a React textarea?',
        answer:
          'Use Prompt Area’s commandTrigger() preset: define your commands as { value, label, description } data, pass an onSearch function, and spread the trigger onto the component. It handles the / character, start-of-line detection, and the dropdown.',
      },
      {
        question: 'How do I detect which slash command the user picked?',
        answer:
          'Call getChipsByTrigger(value, "/") to read the selected command as a typed chip. You get the command value directly without parsing the input text.',
      },
      {
        question: 'Can I combine slash commands with @mentions in the same input?',
        answer:
          'Yes. Mentions, commands, and tags all use the same trigger system, so you can pass mentionTrigger(), commandTrigger(), and hashtagTrigger() together in the triggers array.',
      },
    ],
    related: [
      {
        href: '/blog/build-ai-chat-textarea-react-mentions',
        label: 'Build an AI chat textarea in React',
      },
      { href: '/vs/lexical', label: 'Prompt Area vs Lexical' },
      { href: '/for-ai-apps', label: 'Prompt Area for AI & LLM apps' },
    ],
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug)
}
