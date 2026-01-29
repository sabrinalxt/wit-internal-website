import { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'destructive' | 'info' | 'muted'
}

export function Badge({ className, variant = 'default', ...props }: Props) {
  const variants = {
    default: 'bg-slate-200 text-slate-800',
    success: 'bg-green-100 text-green-700',
    destructive: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    muted: 'bg-slate-100 text-slate-600',
  }[variant]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants, className)} {...props} />
  )
}


