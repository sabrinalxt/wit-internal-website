import type { User } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

async function getText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.text()
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export function getHealth(): Promise<string> {
  return getText('/health')
}

export function getUsers(): Promise<User[]> {
  return getJson<User[]>('/users')
}



