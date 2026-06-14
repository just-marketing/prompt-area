import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { DocsMobileNav } from '@/components/docs/docs-mobile-nav'
import { TableOfContents } from '@/components/docs/table-of-contents'
import { DocsPager } from '@/components/docs/docs-pager'
import { CopyPageButton } from '@/components/docs/copy-page-button'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DocsMobileNav />
      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 lg:gap-12 lg:px-6">
        {/* Left — grouped section nav */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <DocsSidebar />
          </div>
        </aside>

        {/* Center — article content */}
        <div className="min-w-0 flex-1 pb-12 lg:max-w-2xl">
          <div className="mb-6 flex justify-end">
            <CopyPageButton />
          </div>
          <article className="flex flex-col gap-5">{children}</article>
          <DocsPager />
        </div>

        {/* Right — on this page */}
        <aside className="hidden w-44 shrink-0 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </>
  )
}
