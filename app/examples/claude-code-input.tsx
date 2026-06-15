'use client'

import { useRef, useState } from 'react'
import { Plus, ArrowUp, ChevronDown, GitBranch, Cloud, LayoutList, File, X } from 'lucide-react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import { ActionBar } from '@/registry/new-york/blocks/action-bar/action-bar'
import { StatusBar } from '@/registry/new-york/blocks/status-bar/status-bar'
import type { Segment } from '@/registry/new-york/blocks/prompt-area/types'
import { useSubmittablePrompt } from './use-submittable-prompt'
import { SubmittedPreview } from './submitted-preview'

type AttachedFile = { id: string; name: string }

const INITIAL_FILES: AttachedFile[] = [{ id: 'img-1', name: 'image.png' }]

const INITIAL_SEGMENTS: Segment[] = [
  {
    type: 'text',
    text: "Let's replicate the spacing and general UI/UX of this input.",
  },
]

const MODELS = ['Opus 4.8', 'Sonnet 4.6', 'Haiku 4.5'] as const

export function ClaudeCodeInputExample() {
  const { segments, setSegments, files, setFiles, submitted, promptRef, submit, reset } =
    useSubmittablePrompt<AttachedFile>({
      initialSegments: INITIAL_SEGMENTS,
      initialFiles: INITIAL_FILES,
    })
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0])
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [planMode, setPlanMode] = useState(false)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const isEmpty =
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === 'text' && segments[0].text === '')

  return (
    <div className="flex flex-col gap-2">
      {/* Main input container */}
      <div className="rounded-xl border">
        <div className="p-4 pb-2">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {files.map((file) => (
                <span
                  key={file.id}
                  className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                  <File className="size-3.5" />
                  {file.name}
                  <button
                    type="button"
                    className="hover:text-foreground -mr-0.5 rounded transition-colors"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== file.id))}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <PromptArea
            ref={promptRef}
            value={segments}
            onChange={setSegments}
            placeholder="Ask anything..."
            onSubmit={submit}
            autoGrow
            minHeight={48}
            maxHeight={280}
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
                          className={`hover:bg-accent flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm ${
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
                  onClick={() => submit(segments)}
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

      <SubmittedPreview text={submitted?.text} onReset={reset} />
    </div>
  )
}

export const claudeCodeInputCode = `import { useCallback, useRef, useState } from 'react'
import { Plus, ArrowUp, ChevronDown, GitBranch, Cloud, LayoutList, File, X, RotateCcw } from 'lucide-react'
import { PromptArea } from '@/components/prompt-area'
import { ActionBar } from '@/components/action-bar'
import { StatusBar } from '@/components/status-bar'
import type { Segment, PromptAreaHandle } from '@/components/types'

type AttachedFile = { id: string; name: string }
const INITIAL_FILES: AttachedFile[] = [{ id: 'img-1', name: 'image.png' }]

function ClaudeCodeInputExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [files, setFiles] = useState<AttachedFile[]>(INITIAL_FILES)
  // Snapshot of the last submission so Reset can restore it for another send.
  const [submitted, setSubmitted] = useState<{ segments: Segment[]; files: AttachedFile[] } | null>(null)
  const [selectedModel, setSelectedModel] = useState('Opus 4.8')
  const [planMode, setPlanMode] = useState(false)
  const promptRef = useRef<PromptAreaHandle>(null)

  const submit = (segs: Segment[]) => {
    if (!segs.length) return
    setSubmitted({ segments: segs, files })
    promptRef.current?.clear()
    setSegments([])
    setFiles([])
  }
  const reset = () => {
    if (submitted) { setSegments(submitted.segments); setFiles(submitted.files) }
    setSubmitted(null)
    promptRef.current?.focus()
  }

  return (
    <div className="rounded-xl border">
      <div className="p-4 pb-2">
        {/* Compact file chips */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((file) => (
              <span key={file.id} className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                <File className="size-3.5" />
                {file.name}
                <button onClick={() => setFiles((prev) => prev.filter((x) => x.id !== file.id))}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <PromptArea
          ref={promptRef}
          value={segments}
          onChange={setSegments}
          placeholder="Ask anything..."
          onSubmit={submit}
          autoGrow
          minHeight={48}
          maxHeight={280}
        />
        <ActionBar
          className="pt-1.5"
          left={
            <div className="flex items-center gap-1.5">
              <button className="size-8 rounded-lg"><Plus className="size-4" /></button>
              <button
                onClick={() => setPlanMode((v) => !v)}
                className={\`rounded-full px-3 py-1.5 text-xs font-medium \${
                  planMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }\`}>
                <LayoutList className="size-3.5" /> Plan mode
              </button>
            </div>
          }
          right={
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground text-xs">
                {selectedModel} <ChevronDown className="size-3" />
              </button>
              <button onClick={() => submit(segments)} className="bg-primary text-primary-foreground size-8 rounded-full">
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
            <GitBranch className="size-3" /> <span className="text-xs">main</span>
            <button><Plus className="size-3" /></button>
          </div>
        }
        right={
          <button className="text-muted-foreground text-xs">
            <Cloud className="size-3" /> Default <ChevronDown className="size-3" />
          </button>
        }
      />
      {submitted && (
        <div className="bg-muted/50 m-2 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Submitted — clear to send again.</span>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs" aria-label="Reset">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  )
}`
