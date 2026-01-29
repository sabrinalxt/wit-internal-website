import { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none',
        'focus:border-violet-400 focus:ring-2 focus:ring-violet-200',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}


