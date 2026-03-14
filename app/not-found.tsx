import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-3.5" />
        Back to Prompt Area
      </Link>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="text-foreground hover:text-foreground/80 text-sm font-medium underline underline-offset-4 transition-colors">
        Go back to Prompt Area
      </Link>
    </div>
  )
}
