'use client'

import { useState, useCallback } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment, PromptAreaFile } from '@/registry/new-york/blocks/prompt-area/types'

const SAMPLE_FILES: PromptAreaFile[] = [
  { id: 'file-1', name: 'quarterly-report.pdf', size: 2_458_000, type: 'application/pdf' },
  {
    id: 'file-2',
    name: 'user-data-export-2024-final-version.csv',
    size: 847_200,
    type: 'text/csv',
  },
  { id: 'file-3', name: 'config.json', size: 1_240, type: 'application/json' },
]

const MANY_FILES: PromptAreaFile[] = [
  { id: 'mf-1', name: 'presentation.pdf', size: 5_200_000, type: 'application/pdf' },
  { id: 'mf-2', name: 'budget-2024.csv', size: 320_000, type: 'text/csv' },
  { id: 'mf-3', name: 'notes.txt', size: 4_800, type: 'text/plain' },
  {
    id: 'mf-4',
    name: 'very-long-filename-that-should-be-truncated-gracefully.tsx',
    size: 12_400,
    type: 'text/plain',
  },
  { id: 'mf-5', name: 'logo.png', size: 98_000, type: 'image/png' },
  { id: 'mf-6', name: 'schema.sql', size: 6_700, type: 'text/plain' },
]

export function FileAttachmentsExample() {
  const [normalSegments, setNormalSegments] = useState<Segment[]>([])
  const [compactSegments, setCompactSegments] = useState<Segment[]>([])
  const [normalFiles, setNormalFiles] = useState<PromptAreaFile[]>(SAMPLE_FILES)
  const [compactFiles, setCompactFiles] = useState<PromptAreaFile[]>(MANY_FILES)
  const [clickedFile, setClickedFile] = useState<string | null>(null)

  const handleFileClick = useCallback((file: PromptAreaFile) => {
    setClickedFile(file.name)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">Normal (1–3 files)</div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={normalSegments}
            onChange={setNormalSegments}
            files={normalFiles}
            filePosition="above"
            onFileRemove={(f) => setNormalFiles((prev) => prev.filter((x) => x.id !== f.id))}
            onFileClick={handleFileClick}
            onSubmit={() => setNormalSegments([])}
            placeholder="Attach files to your message..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">
          Many files (4+ files, collapsible with expand)
        </div>
        <div className="rounded-lg border p-4">
          <PromptArea
            value={compactSegments}
            onChange={setCompactSegments}
            files={compactFiles}
            filePosition="above"
            onFileRemove={(f) => setCompactFiles((prev) => prev.filter((x) => x.id !== f.id))}
            onFileClick={handleFileClick}
            onSubmit={() => setCompactSegments([])}
            placeholder="Click +N more to expand all files..."
            minHeight={48}
            maxHeight={200}
          />
        </div>
      </div>
      {clickedFile && <div className="text-muted-foreground text-xs">Clicked: {clickedFile}</div>}
    </div>
  )
}

export const fileAttachmentsCode = `import { useState, useCallback } from 'react'
import { PromptArea } from '@/registry/new-york/blocks/prompt-area/prompt-area'
import type { Segment, PromptAreaFile } from '@/registry/new-york/blocks/prompt-area/types'

const SAMPLE_FILES: PromptAreaFile[] = [
  { id: 'file-1', name: 'quarterly-report.pdf', size: 2_458_000, type: 'application/pdf' },
  { id: 'file-2', name: 'user-data-export-2024-final-version.csv', size: 847_200, type: 'text/csv' },
  { id: 'file-3', name: 'config.json', size: 1_240, type: 'application/json' },
]

function FileAttachmentsExample() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [files, setFiles] = useState<PromptAreaFile[]>(SAMPLE_FILES)

  const handleFileClick = useCallback((file: PromptAreaFile) => {
    console.log('Clicked:', file.name)
  }, [])

  return (
    <PromptArea
      value={segments}
      onChange={setSegments}
      files={files}
      filePosition="above"
      onFileRemove={(f) => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
      onFileClick={handleFileClick}
      onSubmit={() => setSegments([])}
      placeholder="Attach files to your message..."
      minHeight={48}
    />
  )
}`
