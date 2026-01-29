import { useEffect, useState } from 'react'
import { getUsers } from '../api/client'
import type { User } from '../types'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getUsers()
      .then((data) => {
        if (active) setUsers(data)
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) return <div>Loading users...</div>
  if (error) return <div>Failed to load users: {error}</div>

  if (users.length === 0) return <div>No users found.</div>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Users</h2>
      <ul style={{ paddingLeft: 20 }}>
        {users.map((u) => (
          <li key={String(u.user_id)}>
            {u.first_name} {u.last_name} — {u.email}
          </li>
        ))}
      </ul>
    </div>
  )
}


