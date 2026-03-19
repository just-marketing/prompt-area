'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Plus,
  ArrowUp,
  ChevronDown,
  GitBranch,
  Cloud,
  LayoutList,
} from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import { segmentsToPlainText } from '@/registry/new-york/blocks/prompt-area/prompt-area-engine'
import type {
  Segment,
  PromptAreaHandle,
  PromptAreaFile,
} from '@/registry/new-york/blocks/prompt-area/types'

const INITIAL_FILES: PromptAreaFile[] = [
  { id: 'img-1', name: 'image.png', size: 240_000, type: 'image/png' },
]

const INITIAL_SEGMENTS: Segment[] = [
  {
    type: 'text',
    text: "Let's replicate the spacing and general UI/UX of this input.",
  },
]

const MODELS = ['Opus 4.6', 'Sonnet 4.6', 'Haiku 4.5'] as const

export function ClaudeCodeInputExample() {
  const [segments, setSegments] = useState<Segment[]>(INITIAL_SEGMENTS)
  const [files, setFiles] = useState<PromptAreaFile[]>(INITIAL_FILES)
  const [submitted, setSubmitted] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0])
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [planMode, setPlanMode] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  const handleSubmit = useCallback(
    (segs: Segment[]) => {
      const text = segmentsToPlainText(segs)
      if (!text.trim()) return
      setSubmitted(text)
      promptRef.current?.clear()
      setSegments([])
      setFiles([])
    },
    [],
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Main input container */}
      <div className="rounded-xl border">
        <div className="p-4 pb-2">
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            placeholder="Ask anything..."
            onSubmit={handleSubmit}
            autoGrow
            minHeight={48}
            maxHeight={280}
            files={files}
            filePosition="above"
            onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
          />
          <ActionBar
            className="pt-1.5"
            left={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors"
                  aria-label="Add attachment">
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlanMode((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    planMode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  <LayoutList className="size-3.5" />
                  Plan mode
                </button>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                {/* Model selector */}
                <div className="relative" ref={modelMenuRef}>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                    onClick={() => setModelMenuOpen((v) => !v)}>
                    {selectedModel}
                    <ChevronDown className="size-3" />
                  </button>
                  {modelMenuOpen && (
                    <div className="bg-popover absolute right-0 bottom-full z-10 mb-1 flex w-max flex-col rounded-md border p-1 shadow-md">
                      {MODELS.map((model) => (
                        <button
                          key={model}
                          type="button"
                          className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent ${
                            model === selectedModel ? 'bg-accent' : ''
                          }`}
                          onClick={() => {
                            setSelectedModel(model)
                            setModelMenuOpen(false)
                          }}>
                          {model}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={() => handleSubmit(segments)}
                  disabled={isEmpty}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-50"
                  aria-label="Send message">
                  <ArrowUp className="size-4" />
                </button>
              </div>
            }
          />
        </div>

        {/* Status bar */}
        <StatusBar
          className="rounded-b-xl border-t px-4 py-2"
          left={
            <div className="flex items-center gap-2">
              <span className="bg-muted rounded px-2 py-0.5 text-xs font-medium">prompt-area</span>
              <div className="text-muted-foreground flex items-center gap-1">
                <GitBranch className="size-3" />
                <span className="text-xs">main</span>
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded transition-colors"
                aria-label="Add project">
                <Plus className="size-3" />
              </button>
            </div>
          }
          right={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors">
              <Cloud className="size-3" />
              Default
              <ChevronDown className="size-3" />
            </button>
          }
        />
      </div>

      {submitted && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="text-muted-foreground mb-1 text-xs font-medium">Submitted:</div>
          <div className="text-sm">{submitted}</div>
        </div>
      )}
    </div>
  )
}

export const claudeCodeInputCode = `import { useCallback, useRef, useState } from 'react'
import { Plus, ArrowUp, ChevronDown, GitBranch, Cloud, LayoutList } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment, PromptAreaHandle, PromptAreaFile } from '@/registry/new-york/blocks/prompt-area/types'

const INITIAL_FILES: PromptAreaFile[] = [
  { id: 'img-1', name: 'image.png', size: 240_000, type: 'image/png' },
]

function ClaudeCodeInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [files, setFiles] = useState<PromptAreaFile[]>(INITIAL_FILES)
  const [selectedModel, setSelectedModel] = useState('Opus 4.6')
  const [planMode, setPlanMode] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)

  const isEmpty = segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  const handleSubmit = useCallback((segs: Segment[]) => {
    promptRef.current?.clear()
    setSegments([])
    setFiles([])
  }, [])

  return (
    <div className="rounded-xl border">
      <div className="p-4 pb-2">
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          placeholder="Ask anything..."
          onSubmit={handleSubmit}
          autoGrow
          minHeight={48}
          maxHeight={280}
          files={files}
          filePosition="above"
          onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
        />
        <ActionBar
          className="pt-1.5"
          left={
            <div className="flex items-center gap-1.5">
              <button aria-label="Add attachment" className="size-8 rounded-lg ...">
                <Plus className="size-4" />
              </button>
              <button
                onClick={() => setPlanMode((v) => !v)}
                className={\`rounded-full px-3 py-1.5 text-xs font-medium \${
                  planMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }\`}>
                <LayoutList className="size-3.5" />
                Plan mode
              </button>
            </div>
          }
          right={
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground text-xs">
                {selectedModel} <ChevronDown className="size-3" />
              </button>
              <button
                onClick={() => handleSubmit(segments)}
                disabled={isEmpty}
                className="bg-primary text-primary-foreground size-8 rounded-full"
                aria-label="Send message">
                <ArrowUp className="size-4" />
              </button>
            </div>
          }
        />
      </div>
      <StatusBar
        className="rounded-b-xl border-t px-4 py-2"
        left={
          <div className="flex items-center gap-2">
            <span className="bg-muted rounded px-2 py-0.5 text-xs font-medium">prompt-area</span>
            <GitBranch className="size-3" />
            <span className="text-xs">main</span>
            <button aria-label="Add project"><Plus className="size-3" /></button>
          </div>
        }
        right={
          <button className="text-muted-foreground text-xs">
            <Cloud className="size-3" /> Default <ChevronDown className="size-3" />
          </button>
        }
      />
    </div>
  )
}`
