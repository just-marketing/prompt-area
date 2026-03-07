import { cn } from '@/lib/utils'

type RemoveButtonProps = {
  onClick: () => void
  label: string
  className?: string
}

export function RemoveButton({ onClick, label, className }: RemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'absolute top-0.5 right-0.5 grid h-3.5 w-3.5 cursor-pointer place-items-center',
        'rounded-full bg-black/60 text-white hover:bg-black/80 dark:bg-white/60 dark:text-black dark:hover:bg-white/80',
        'transition-colors',
        className,
      )}
      aria-label={label}>
      <svg
        width="8"
        height="8"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round">
        <line x1="2.75" y1="2.75" x2="7.25" y2="7.25" />
        <line x1="7.25" y1="2.75" x2="2.75" y2="7.25" />
      </svg>
    </button>
  )
}
