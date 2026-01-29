import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{
      maxWidth: 'none',
      margin: 0,
      padding: 0,
      fontFamily: 'Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji'
    }}>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 170,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 24px',
        zIndex: 50,
        background: 'linear-gradient(180deg, rgba(120, 90, 200, 0.28) 0%, rgba(120, 90, 200, 0.00) 100%)'
      }}>
        <img
          src={'/logo.png'}
          alt="WIT logo"
          style={{ height: 120, width: 120, objectFit: 'contain', position: 'absolute', left: 16, top: 14 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{
          margin: 0,
          fontFamily: "'Adobe Caslon Pro','Adobe Caslon','Caslon','Cormorant Garamond',serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: 0.4,
          color: '#1a1340'
        }}>Women in Tech</h1>
          <div style={{
            marginTop: 6,
            fontFamily: 'Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
            fontSize: 14,
            letterSpacing: 2.5,
            color: '#4b4763'
          }}>CONNECT, EMPOWER, BUILD</div>
          <div style={{
            margin: '10px auto 0 auto',
            height: 2,
            width: '82%',
            background: 'linear-gradient(90deg, rgba(90,52,234,0.35), rgba(94,226,255,0.35))',
            borderRadius: 2
          }} />
        </div>
      </header>
      <main style={{ paddingTop: 150 }}>{children}</main>
    </div>
  )
}


