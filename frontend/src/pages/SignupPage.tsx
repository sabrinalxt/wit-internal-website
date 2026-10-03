import { useState } from 'react'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    // TODO(login-signup-wiring): call the signup endpoint (claim a pre-created account)
    console.log({ firstName, lastName, email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-10">
      <div className="bg-white rounded-xl shadow-soft border border-slate-100 w-full max-w-lg px-8 py-10">
        <div style={styles.header}> 
          <h2 className="accent-purple text-2xl font-bold mb-1">Create your account</h2>
          <p style={styles.subtitle}>Join the community</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.row2}> 
            <div style={styles.fieldCol}>
              <label style={styles.label} htmlFor="first">First name</label>
              <input id="first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.fieldCol}>
              <label style={styles.label} htmlFor="last">Last name</label>
              <input id="last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} required />
            </div>
          </div>

          <label style={styles.label} htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="name@nus.edu.sg" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />

          <label style={styles.label} htmlFor="password">Password</label>
          <div style={styles.passwordRow}>
            <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...styles.input, paddingRight: 44 }} required />
            <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={styles.eyeButton}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label style={styles.label} htmlFor="confirm">Retype password</label>
          <div style={styles.passwordRow}>
            <input id="confirm" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ ...styles.input, paddingRight: 44 }} required />
            <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label={showConfirm ? 'Hide password' : 'Show password'} style={styles.eyeButton}>
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>

          <button type="submit" className="w-full rounded-lg bg-purple-accent text-white font-semibold py-3 mt-2 hover:brightness-105 transition">Create account</button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background:
      'radial-gradient(1200px 600px at -10% -10%, rgba(186, 160, 255, 0.35), transparent),\
       radial-gradient(800px 500px at 110% 10%, rgba(153, 233, 255, 0.35), transparent),\
       linear-gradient(180deg, #efe6ff 0%, #e6dbff 100%)',
    color: '#171325',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(10, 0, 40, 0.06)',
    boxShadow: '0 20px 50px rgba(59, 35, 120, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: 32,
    marginTop: -40
  },
  header: { textAlign: 'center' as const, marginBottom: 18 },
  title: { margin: '0 0 6px 0', fontSize: 28, letterSpacing: 0.2 },
  subtitle: { margin: 0, color: '#5c5b73' },
  form: { marginTop: 16, display: 'flex', flexDirection: 'column' as const, gap: 10 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  fieldCol: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 13, color: '#4b4763' },
  input: {
    width: '100%',
    background: '#faf8ff',
    color: '#171325',
    border: '1px solid #d7cff7',
    borderRadius: 12,
    padding: '14px 16px',
    outline: 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
    boxSizing: 'border-box'
  },
  passwordRow: { position: 'relative' as const, width: '100%' },
  eyeButton: {
    position: 'absolute' as const,
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    height: 28,
    padding: '0 8px',
    background: 'transparent',
    color: '#6f6b8a',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },
  primaryButton: {
    marginTop: 10,
    width: '100%',
    background: 'linear-gradient(90deg, #9b6dff 0%, #5ee2ff 100%)',
    color: '#1a1340',
    fontWeight: 700,
    border: 'none',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer'
  }
}


