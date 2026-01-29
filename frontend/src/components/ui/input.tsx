import { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none',
        'placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200',
        className,
      )}
      {...props}
    />
  )
}


