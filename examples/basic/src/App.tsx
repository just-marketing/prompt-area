import { useState } from 'react'
import { PromptArea, segmentsToPlainText, type Segment, type TriggerConfig } from 'prompt-area'

const USERS = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Mathematician' },
  { value: 'grace', label: 'Grace Hopper', description: 'Compilers' },
  { value: 'linus', label: 'Linus Torvalds', description: 'Kernel' },
  { value: 'margaret', label: 'Margaret Hamilton', description: 'Apollo' },
]

const COMMANDS = [
  { value: 'summarize', label: 'summarize', description: 'Condense the text' },
  { value: 'translate', label: 'translate', description: 'Translate to another language' },
  { value: 'explain', label: 'explain', description: 'Explain like I’m five' },
]

const TAGS = [
  { value: 'bug', label: 'bug' },
  { value: 'feature', label: 'feature' },
  { value: 'docs', label: 'docs' },
]

const search = (items: { value: string; label: string; description?: string }[]) => (q: string) =>
  items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))

const triggers: TriggerConfig[] = [
  { char: '@', position: 'any', mode: 'dropdown', onSearch: search(USERS) },
  { char: '/', position: 'start', mode: 'dropdown', onSearch: search(COMMANDS) },
  { char: '#', position: 'any', mode: 'dropdown', onSearch: search(TAGS) },
]

export function App() {
  const [value, setValue] = useState<Segment[]>([])
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <main>
      <header>
        <h1>Prompt Area</h1>
        <p>
          A dependency-light rich-text prompt input. Type <kbd>@</kbd>, <kbd>/</kbd>, or{' '}
          <kbd>#</kbd> to trigger chips, then press <kbd>Enter</kbd> to submit.
        </p>
      </header>

      <PromptArea
        value={value}
        onChange={setValue}
        triggers={triggers}
        placeholder="Message… try @ada, /summarize, #bug"
        minHeight={56}
        autoGrow
        onSubmit={(segments) => {
          setSubmitted(segmentsToPlainText(segments))
          setValue([])
        }}
      />

      {submitted !== null && (
        <section className="result">
          <span className="result__label">Submitted</span>
          <pre>{submitted || '(empty)'}</pre>
        </section>
      )}

      <footer>
        <a href="https://prompt-area.com" target="_blank" rel="noreferrer">
          prompt-area.com
        </a>
        {' · '}
        <a href="https://www.npmjs.com/package/prompt-area" target="_blank" rel="noreferrer">
          npm
        </a>
      </footer>
    </main>
  )
}
