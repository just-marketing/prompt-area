import type { Metadata } from 'next'
import { DocsLead, DocsH2 } from '@/components/docs/docs-primitives'
import { DocsExample } from '@/components/docs/docs-example'
import {
  ImageAttachmentsExample,
  imageAttachmentsCode,
  FileAttachmentsExample,
  fileAttachmentsCode,
  CopyPasteExample,
  copyPasteCode,
} from '@/app/examples'

const SITE_URL = 'https://prompt-area.com'

export const metadata: Metadata = {
  title: 'Attachments',
  description:
    'Live examples of image and file attachments in Prompt Area, plus copy & paste that preserves chip data and auto-resolves triggers from external text.',
  alternates: { canonical: `${SITE_URL}/docs/examples/attachments` },
}

export default function AttachmentsExamplesPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Attachments</h1>
      <DocsLead>Attach images and files, and preserve chips through copy &amp; paste.</DocsLead>

      <DocsH2 id="examples">Examples</DocsH2>
      <DocsExample
        id="images"
        title="Image attachments"
        description="Paste an image to attach it. Images show a loading state during upload; click × to remove. Use imagePosition to control placement."
        code={imageAttachmentsCode}>
        <ImageAttachmentsExample />
      </DocsExample>
      <DocsExample
        id="files"
        title="File attachments"
        description="Attach files with a type icon, name, and metadata. With 4+ files, the first 3 show with a “+N more” button."
        code={fileAttachmentsCode}>
        <FileAttachmentsExample />
      </DocsExample>
      <DocsExample
        id="copy-paste"
        title="Copy & paste"
        description="Copy content with chips and paste it elsewhere — chips are preserved. Pasting plain text like @Copywriter #campaign auto-resolves matching triggers."
        code={copyPasteCode}>
        <CopyPasteExample />
      </DocsExample>
    </>
  )
}
