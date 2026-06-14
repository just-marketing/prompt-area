// ---------------------------------------------------------------------------
// Comparison data for /vs/[slug] pages.
//
// Each entry powers an honest, high-intent "Prompt Area vs X" comparison page.
// Kept as plain typed data so the renderer, /compare index, sitemap, and
// JSON-LD all read from a single source of truth.
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://prompt-area.com'
export const INSTALL_CMD = 'npx shadcn@latest add https://prompt-area.com/r/prompt-area.json'

export type Support = 'full' | 'partial' | 'none'

export interface FeatureRow {
  feature: string
  promptArea: Support | string
  competitor: Support | string
}

export interface ComparisonFaq {
  question: string
  answer: string
}

export interface Comparison {
  slug: string
  /** Competitor display name */
  name: string
  /** Competitor homepage/repo */
  url: string
  /** Short label under headings, e.g. "ProseMirror editor framework" */
  kind: string
  /** <title> — keep under ~60 chars where possible */
  metaTitle: string
  metaDescription: string
  /** H1 on the page */
  heading: string
  /** One-sentence answer up top — optimized for featured snippets & AI citation */
  tldr: string
  /** 2–3 intro paragraphs */
  intro: string[]
  /** What the competitor is, in fair terms */
  competitorSummary: string
  features: FeatureRow[]
  promptAreaStrengths: string[]
  competitorStrengths: string[]
  choosePromptAreaWhen: string[]
  chooseCompetitorWhen: string[]
  /** Optional migration guidance (used for react-mentions) */
  migration?: { intro: string; steps: string[] }
  faq: ComparisonFaq[]
}

export const COMPARISONS: Comparison[] = [
  {
    slug: 'react-mentions',
    name: 'react-mentions',
    url: 'https://github.com/signavio/react-mentions',
    kind: '@mention textarea library',
    metaTitle: 'Prompt Area vs react-mentions — Modern Alternative & Migration',
    metaDescription:
      'A side-by-side comparison of Prompt Area and react-mentions, plus a migration guide. Prompt Area adds /commands, #tags, markdown, and file attachments with zero extra dependencies.',
    heading: 'Prompt Area vs react-mentions',
    tldr: 'react-mentions handles @mentions in a textarea and little else. Prompt Area is a modern, zero-dependency alternative that keeps @mentions and adds /commands, #tags, inline markdown, file attachments, undo/redo, and companion layout components.',
    intro: [
      'react-mentions has been the default way to add @mentions to a React textarea for years, and it is still downloaded hundreds of thousands of times a week. But its last major release was in 2022, and it was only ever designed to do one thing: render @mention suggestions over a plain textarea.',
      'Modern AI chat and prompt interfaces need more than mentions. They need slash commands, tags, file attachments, inline formatting, and a clean way to read structured data back out of the input. Prompt Area was built for exactly that — and it installs through the shadcn registry, so you own and customize the source.',
    ],
    competitorSummary:
      'react-mentions is a focused, mature library that overlays @mention (and custom-trigger) suggestions on a controlled textarea. It is lightweight and battle-tested, but feature development has largely stopped and it has no concept of commands, tags, markdown, attachments, or undo/redo.',
    features: [
      { feature: '@Mentions', promptArea: 'full', competitor: 'full' },
      { feature: '/Slash commands', promptArea: 'full', competitor: 'none' },
      { feature: '#Hashtag tags', promptArea: 'full', competitor: 'partial' },
      { feature: 'Inline markdown', promptArea: 'full', competitor: 'none' },
      { feature: 'File & image attachments', promptArea: 'full', competitor: 'none' },
      { feature: 'Undo / redo history', promptArea: 'full', competitor: 'none' },
      { feature: 'Structured segment output', promptArea: 'full', competitor: 'partial' },
      { feature: 'Companion layout components', promptArea: 'full', competitor: 'none' },
      { feature: 'Actively maintained', promptArea: 'full', competitor: 'partial' },
      { feature: 'Extra dependencies', promptArea: '0', competitor: '0' },
      { feature: 'Distribution', promptArea: 'shadcn registry', competitor: 'npm package' },
    ],
    promptAreaStrengths: [
      'One component covers mentions, commands, tags, markdown, and attachments',
      'Structured output: read typed chips with getChipsByTrigger() instead of parsing strings',
      'Ships Action Bar, Status Bar, Compact, and Chat Prompt Layout companions',
      'shadcn registry distribution — the source lives in your repo, fully editable',
      'Actively maintained, built for current AI chat UX',
    ],
    competitorStrengths: [
      'Extremely focused and small if you truly only need @mentions',
      'Years of production usage and a large install base',
      'Works as a controlled component with a familiar value/onChange API',
      'No build setup beyond a plain npm install',
    ],
    choosePromptAreaWhen: [
      'You are building an AI chat or prompt composer, not just a comment box',
      'You need /commands, #tags, markdown, or file attachments alongside mentions',
      'You want structured data out of the input, not just a rendered string',
      'You want a component you can restyle and extend as your own source',
    ],
    chooseCompetitorWhen: [
      'You only need @mentions and want the smallest possible surface area',
      'You are maintaining an existing react-mentions integration that already works',
      'You prefer a plain npm dependency over a shadcn registry setup',
    ],
    migration: {
      intro:
        'Migrating from react-mentions to Prompt Area is mostly a matter of moving your mention data into a trigger and reading structured segments instead of parsing a markup string.',
      steps: [
        'Install Prompt Area: ' + INSTALL_CMD,
        'Replace your <MentionsInput> with <PromptArea> and the usePromptAreaState() hook.',
        'Map your react-mentions <Mention> data source to a mentionTrigger() with the same items.',
        'Swap markup-string parsing for getChipsByTrigger("@") to read resolved mentions as typed data.',
        'Optionally add commandTrigger() and hashtagTrigger() to enable /commands and #tags.',
      ],
    },
    faq: [
      {
        question: 'Is Prompt Area a drop-in replacement for react-mentions?',
        answer:
          'Not line-for-line, but the migration is small. You replace MentionsInput with PromptArea, move your mention data into a mentionTrigger(), and read resolved mentions as structured chips instead of parsing a markup string. In exchange you also get commands, tags, markdown, and attachments.',
      },
      {
        question: 'Why look for a react-mentions alternative?',
        answer:
          'react-mentions only handles @mentions and its last major release was in 2022. Teams building AI chat interfaces typically also need slash commands, tags, file attachments, and structured output — which is what Prompt Area provides.',
      },
      {
        question: 'Does Prompt Area support custom triggers like react-mentions?',
        answer:
          'Yes. Prompt Area uses a general trigger system — any character (@, /, #, or a custom one) can open a dropdown or fire a callback, and selections resolve into immutable, typed chip segments.',
      },
    ],
  },
  {
    slug: 'tiptap',
    name: 'Tiptap',
    url: 'https://tiptap.dev',
    kind: 'ProseMirror editor framework',
    metaTitle: 'Prompt Area vs Tiptap — Lightweight Chat Input Alternative',
    metaDescription:
      'Prompt Area vs Tiptap compared. Tiptap is a ProseMirror framework for full document editors; Prompt Area is a zero-dependency shadcn chat input with mentions, commands, tags, and attachments.',
    heading: 'Prompt Area vs Tiptap',
    tldr: 'Tiptap is a powerful ProseMirror-based framework for building full rich-text and document editors. Prompt Area is a focused, zero-dependency chat input. Choose Tiptap for documents and collaboration; choose Prompt Area for AI prompt and chat composers.',
    intro: [
      'Tiptap is one of the most popular rich-text frameworks in the React ecosystem. Built on ProseMirror, it can power everything from Notion-style docs to comment editors, with a deep extension ecosystem and paid collaboration features.',
      'That power comes with weight. To build a chat input with Tiptap you assemble ProseMirror nodes, marks, and extensions, and you pull in several dependencies. If all you need is a prompt composer with mentions, commands, tags, and attachments, Prompt Area gets you there with a single component and no extra dependencies.',
    ],
    competitorSummary:
      'Tiptap is a headless, extensible editor framework built on ProseMirror. It excels at full document editing — block formatting, tables, collaborative editing, and a large extension catalog — and monetizes premium collaboration, AI, and comments features.',
    features: [
      { feature: '@Mentions', promptArea: 'full', competitor: 'partial' },
      { feature: '/Slash commands', promptArea: 'full', competitor: 'full' },
      { feature: '#Hashtag tags', promptArea: 'full', competitor: 'partial' },
      { feature: 'Inline markdown', promptArea: 'full', competitor: 'full' },
      { feature: 'File & image attachments', promptArea: 'full', competitor: 'partial' },
      { feature: 'Block / document editing', promptArea: 'none', competitor: 'full' },
      { feature: 'Collaborative editing', promptArea: 'none', competitor: 'full' },
      { feature: 'Companion chat layout components', promptArea: 'full', competitor: 'none' },
      { feature: 'Extra dependencies', promptArea: '0', competitor: '3+' },
      { feature: 'Distribution', promptArea: 'shadcn registry', competitor: 'npm package' },
    ],
    promptAreaStrengths: [
      'Zero dependencies — no ProseMirror schema to learn or maintain',
      'Mentions, commands, tags, markdown, and attachments built in',
      'Purpose-built chat companions (Action Bar, Status Bar, Chat Prompt Layout)',
      'shadcn registry source you own and restyle',
      'Smaller bundle and faster to integrate for chat use cases',
    ],
    competitorStrengths: [
      'Full document editing: blocks, tables, columns, and complex formatting',
      'Real-time collaborative editing and presence',
      'Huge extension ecosystem and active commercial backing',
      'Best-in-class when you need a true WYSIWYG editor',
    ],
    choosePromptAreaWhen: [
      'You are building a chat or prompt input, not a document editor',
      'You want zero dependencies and a small footprint',
      'You need mentions, commands, tags, and attachments without assembling extensions',
      'You want ready-made chat layout components',
    ],
    chooseCompetitorWhen: [
      'You need full document editing with blocks, tables, and columns',
      'You need real-time collaborative editing',
      'You are building a Notion-style or long-form content editor',
      'You want a deep extension ecosystem to customize editing behavior',
    ],
    faq: [
      {
        question: 'Is Prompt Area a lighter Tiptap alternative?',
        answer:
          'Yes, for chat and prompt inputs. Prompt Area delivers mentions, commands, tags, markdown, and attachments with zero dependencies and no ProseMirror schema, whereas Tiptap is a full editor framework. For document editing, Tiptap remains the stronger choice.',
      },
      {
        question: 'Can I build a chat input with Tiptap instead?',
        answer:
          'You can, but you assemble ProseMirror extensions and pull in several dependencies. Prompt Area is purpose-built for that exact use case, so it is faster to integrate and lighter at runtime.',
      },
      {
        question: 'Does Prompt Area use ProseMirror?',
        answer:
          'No. Prompt Area is built directly on contentEditable with its own segment engine and has no ProseMirror, Slate, or Lexical dependency.',
      },
    ],
  },
  {
    slug: 'plate',
    name: 'Plate.js',
    url: 'https://platejs.org',
    kind: 'Slate editor framework',
    metaTitle: 'Prompt Area vs Plate.js — shadcn Chat Input vs Slate Editor',
    metaDescription:
      'Prompt Area vs Plate.js compared. Both install via the shadcn registry, but Plate.js is a Slate-based document editor while Prompt Area is a zero-dependency chat and prompt input.',
    heading: 'Prompt Area vs Plate.js',
    tldr: 'Plate.js is a Slate-based framework for building Notion-style document editors and installs via the shadcn registry. Prompt Area also installs via shadcn but is a focused, zero-dependency chat input. Choose Plate for documents; choose Prompt Area for prompt composers.',
    intro: [
      'Plate.js is the closest competitor to Prompt Area in distribution: both add to your project through the shadcn registry. But the two solve different problems. Plate is a Slate-based editor framework aimed at rich, Notion-like document editing with a large catalog of plugins and components.',
      'Prompt Area is deliberately narrower. It is a single chat-input component — mentions, commands, tags, markdown, and attachments — with zero extra dependencies and no Slate plugin chain to manage. If you are building an AI composer rather than a document editor, that narrowness is the feature.',
    ],
    competitorSummary:
      'Plate.js is a rich-text framework built on Slate, distributed through a shadcn-style registry. It offers a deep set of plugins and ready-made components for building full document and block editors, with an optional commercial template.',
    features: [
      { feature: '@Mentions', promptArea: 'full', competitor: 'full' },
      { feature: '/Slash commands', promptArea: 'full', competitor: 'full' },
      { feature: '#Hashtag tags', promptArea: 'full', competitor: 'partial' },
      { feature: 'Inline markdown', promptArea: 'full', competitor: 'full' },
      { feature: 'File & image attachments', promptArea: 'full', competitor: 'partial' },
      { feature: 'Block / document editing', promptArea: 'none', competitor: 'full' },
      { feature: 'shadcn registry install', promptArea: 'full', competitor: 'full' },
      { feature: 'Companion chat layout components', promptArea: 'full', competitor: 'none' },
      { feature: 'Extra dependencies', promptArea: '0', competitor: '5+' },
    ],
    promptAreaStrengths: [
      'Zero dependencies — no Slate plugin chain to wire up or upgrade',
      'Single component focused on prompt and chat input',
      'Built-in chat companions (Action Bar, Status Bar, Chat Prompt Layout)',
      'Simpler mental model and API for the chat use case',
    ],
    competitorStrengths: [
      'Full block and document editing with a large plugin catalog',
      'Notion-style editing experiences out of the box',
      'Rich component library for complex editors',
      'Strong choice when editing is the product, not just input',
    ],
    choosePromptAreaWhen: [
      'You need a chat or prompt input, not a document editor',
      'You want zero dependencies and a minimal API',
      'You want chat layout components included',
      'You prefer not to manage a Slate plugin dependency chain',
    ],
    chooseCompetitorWhen: [
      'You are building a Notion-style block or document editor',
      'You need an extensive plugin ecosystem for rich editing',
      'You want ready-made components for complex document features',
    ],
    faq: [
      {
        question: 'Plate.js and Prompt Area both use the shadcn registry — how do I choose?',
        answer:
          'Choose by use case. Plate.js is a Slate-based document/block editor; Prompt Area is a chat and prompt input. If you are building a composer for an AI chat app, Prompt Area is lighter and faster to integrate. If you are building a document editor, Plate is the better fit.',
      },
      {
        question: 'Does Prompt Area depend on Slate like Plate.js?',
        answer:
          'No. Prompt Area has zero extra dependencies and is built directly on contentEditable, while Plate.js is built on Slate and pulls in its plugin ecosystem.',
      },
    ],
  },
  {
    slug: 'lexical',
    name: 'Lexical',
    url: 'https://lexical.dev',
    kind: "Meta's editor framework",
    metaTitle: 'Prompt Area vs Lexical — Ready-Made Chat Input vs Framework',
    metaDescription:
      "Prompt Area vs Lexical compared. Lexical is Meta's extensible editor framework requiring plugin assembly; Prompt Area is a zero-dependency chat input with mentions and commands built in.",
    heading: 'Prompt Area vs Lexical',
    tldr: "Lexical is Meta's extensible, high-performance editor framework where you assemble plugins for features like mentions. Prompt Area provides mentions, commands, tags, and attachments built in, with zero dependencies. Choose Lexical to build a custom editor; choose Prompt Area for a ready-made chat input.",
    intro: [
      'Lexical is Meta’s modern editor framework — fast, accessible, and designed to be extended through a plugin architecture. It powers editing experiences at large scale and is an excellent foundation if you want to build your own editor from primitives.',
      'But "framework" is the key word. To get @mentions or a command menu in Lexical, you assemble nodes and plugins yourself. Prompt Area ships those behaviors as a finished component with zero extra dependencies, so a chat composer is a one-command install rather than a build project.',
    ],
    competitorSummary:
      'Lexical is an extensible text-editor framework from Meta with a strong focus on performance, accessibility, and a plugin-based architecture. It gives you primitives to build custom editing experiences rather than a finished input.',
    features: [
      { feature: '@Mentions', promptArea: 'full', competitor: 'partial' },
      { feature: '/Slash commands', promptArea: 'full', competitor: 'partial' },
      { feature: '#Hashtag tags', promptArea: 'full', competitor: 'partial' },
      { feature: 'Inline markdown', promptArea: 'full', competitor: 'full' },
      { feature: 'File & image attachments', promptArea: 'full', competitor: 'none' },
      { feature: 'Works out of the box', promptArea: 'full', competitor: 'partial' },
      { feature: 'Companion chat layout components', promptArea: 'full', competitor: 'none' },
      { feature: 'Extensible plugin architecture', promptArea: 'partial', competitor: 'full' },
      { feature: 'Extra dependencies', promptArea: '0', competitor: '2+' },
    ],
    promptAreaStrengths: [
      'Mentions, commands, tags, markdown, and attachments work out of the box',
      'Zero dependencies and no plugin assembly required',
      'Chat companions included (Action Bar, Status Bar, Chat Prompt Layout)',
      'Fastest path to a working chat composer',
    ],
    competitorStrengths: [
      'Best-in-class extensibility through a plugin architecture',
      'High performance and strong accessibility foundations',
      'Backed by Meta and used at very large scale',
      'Ideal when you need to build a fully custom editor',
    ],
    choosePromptAreaWhen: [
      'You want a finished chat input, not an editor framework',
      'You need mentions, commands, tags, and attachments without writing plugins',
      'You want zero dependencies and a quick integration',
    ],
    chooseCompetitorWhen: [
      'You are building a custom editor and want full control of behavior',
      'You need a plugin architecture to extend editing deeply',
      'You are optimizing for very large-scale, bespoke editing experiences',
    ],
    faq: [
      {
        question: 'Does Prompt Area replace Lexical?',
        answer:
          'For chat and prompt inputs, yes — it gives you mentions, commands, tags, and attachments without assembling plugins. For building a fully custom, extensible editor, Lexical is the right foundation.',
      },
      {
        question: 'How much work is a mentions input in Lexical vs Prompt Area?',
        answer:
          'In Lexical you build or wire up nodes and a typeahead plugin yourself. In Prompt Area you configure a mentionTrigger() and it works immediately, with selections resolving into typed chips.',
      },
    ],
  },
  {
    slug: 'assistant-ui',
    name: 'assistant-ui',
    url: 'https://assistant-ui.com',
    kind: 'Full AI chat UI toolkit',
    metaTitle: 'Prompt Area vs assistant-ui — Just the Input vs Full Chat Kit',
    metaDescription:
      'Prompt Area vs assistant-ui compared. assistant-ui is a full, opinionated AI chat UI kit; Prompt Area is just the input layer — a zero-dependency composer you can drop into any LLM stack.',
    heading: 'Prompt Area vs assistant-ui',
    tldr: 'assistant-ui is a full, opinionated AI chat UI toolkit — message threads, runtime, and input together. Prompt Area is just the input layer: a zero-dependency composer with mentions, commands, tags, and attachments that drops into any LLM stack. They can even be used together.',
    intro: [
      'assistant-ui is a popular, YC-backed toolkit for building complete ChatGPT-style chat experiences in React. It brings the whole thread — message list, runtime/state, and the composer — and integrates with frameworks like the Vercel AI SDK and LangChain.',
      'Prompt Area solves a smaller, sharper problem: the input itself. It does not own your message thread or runtime, which means no lock-in and full freedom over your chat architecture. If you want the composer specifically — with mentions, commands, tags, and attachments — Prompt Area is a drop-in textarea. The two are complementary as much as competitive: Prompt Area can serve as the input inside an assistant-ui app.',
    ],
    competitorSummary:
      'assistant-ui is a full-stack, opinionated AI chat UI kit. It provides the message thread, runtime/state management, and composer as an integrated system, with adapters for common LLM frameworks. It is the fastest way to ship a complete chat surface — at the cost of adopting its architecture.',
    features: [
      { feature: 'Chat input / composer', promptArea: 'full', competitor: 'full' },
      { feature: '@Mentions', promptArea: 'full', competitor: 'full' },
      { feature: '/Slash commands', promptArea: 'full', competitor: 'full' },
      { feature: '#Hashtag tags', promptArea: 'full', competitor: 'partial' },
      { feature: 'Inline markdown in input', promptArea: 'full', competitor: 'partial' },
      { feature: 'File & image attachments', promptArea: 'full', competitor: 'full' },
      { feature: 'Message thread / runtime', promptArea: 'none', competitor: 'full' },
      { feature: 'No architectural lock-in', promptArea: 'full', competitor: 'partial' },
      { feature: 'Works inside any chat stack', promptArea: 'full', competitor: 'partial' },
      { feature: 'Extra dependencies', promptArea: '0', competitor: 'several' },
    ],
    promptAreaStrengths: [
      'Just the input — no message thread or runtime to adopt',
      'No lock-in: bring your own state, transport, and LLM provider',
      'Zero dependencies and shadcn registry source you own',
      'Can be used as the composer inside an assistant-ui app',
    ],
    competitorStrengths: [
      'A complete chat experience out of the box, not just the input',
      'Built-in runtime/state and message thread rendering',
      'Adapters for the Vercel AI SDK, LangChain, and more',
      'Fastest path to a full ChatGPT-style UI when you want the whole kit',
    ],
    choosePromptAreaWhen: [
      'You only need the input/composer, not the whole chat UI',
      'You already have (or want to own) your message thread and runtime',
      'You want zero dependencies and no architectural lock-in',
      'You want a composer you can drop into any existing chat app',
    ],
    chooseCompetitorWhen: [
      'You want a complete chat UI — thread, runtime, and input together',
      'You want built-in adapters for LLM frameworks',
      'You are starting from scratch and want the fastest full-chat path',
    ],
    faq: [
      {
        question: 'Can I use Prompt Area with assistant-ui?',
        answer:
          'Yes. Prompt Area is just the input layer, so it can serve as the composer inside an assistant-ui app while assistant-ui handles the message thread and runtime. They are complementary.',
      },
      {
        question: 'What is the difference between Prompt Area and assistant-ui?',
        answer:
          'assistant-ui is a full AI chat UI kit (thread + runtime + input). Prompt Area is only the input — a zero-dependency composer with no lock-in that works inside any chat stack, including assistant-ui.',
      },
    ],
  },
]

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug)
}
