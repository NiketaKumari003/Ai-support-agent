import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:4000'

function generateSessionId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function useTheme() {
  const [theme, setTheme] = useState('system')

  useEffect(() => {
    const stored = window.localStorage.getItem('asa-theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    let effective = theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      effective = prefersDark ? 'dark' : 'light'
    }
    root.dataset.theme = effective
    window.localStorage.setItem('asa-theme', theme)
  }, [theme])

  return { theme, setTheme }
}

function App() {
  const { theme, setTheme } = useTheme()
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [sessionId, setSessionId] = useState(generateSessionId)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  const isAuthenticated = !!token

  const themeLabel = useMemo(() => {
    if (theme === 'system') return 'System'
    return theme === 'dark' ? 'Dark' : 'Light'
  }, [theme])

  function handleThemeCycle() {
    setTheme((prev) => {
      if (prev === 'system') return 'light'
      if (prev === 'light') return 'dark'
      return 'system'
    })
  }

  async function handleAuthSubmit(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = authMode === 'login'
        ? { email, password }
        : { name, email, password }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }
      setToken(data.token)
      setUser(data.user)
      setSessionId(generateSessionId())
      setMessages([])
    } catch (err) {
      setAuthError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    setToken('')
    setUser(null)
    setMessages([])
    setSessionId(generateSessionId())
    setEmail('')
    setPassword('')
    setName('')
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return
    setChatError('')
    const messageText = input.trim()
    setInput('')

    const nextMessages = [
      ...messages,
      { id: `${Date.now()}-user`, from: 'user', message: messageText },
    ]
    setMessages(nextMessages)
    setChatLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          message: messageText,
          userId: user?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Chat failed')
      }

      const reply = data.reply || {}
      const replyText = reply.message || data.raw || 'No reply received.'
      const from = reply.type === 'error' ? 'system' : 'assistant'

      const assistantMessage = {
        id: `${Date.now()}-${from}`,
        from,
        message: replyText,
      }
      setMessages([...nextMessages, assistantMessage])
    } catch (err) {
      setChatError(err.message || 'Chat failed')
      setMessages(nextMessages)
    } finally {
      setChatLoading(false)
    }
  }

  async function handleEscalate() {
    setChatError('')
    try {
      const res = await fetch(`${API_BASE}/api/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          reason: 'User requested human support from UI',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Escalation failed')
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-escalate`,
          from: 'system',
          message: 'Your request has been escalated to a human agent.',
        },
      ])
    } catch (err) {
      setChatError(err.message || 'Escalation failed')
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div className="brand-text">
            <span className="brand-title">AI Support Agent</span>
            <span className="brand-subtitle">Smart support with human fallback</span>
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={handleThemeCycle}
          >
            Theme: {themeLabel}
          </button>

          {isAuthenticated && (
            <div className="user-pill">
              <span className="user-name">{user?.name || user?.email}</span>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {!isAuthenticated ? (
          <section className="auth-panel">
            <div className="auth-toggle">
              <button
                className={authMode === 'login' ? 'auth-tab active' : 'auth-tab'}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'auth-tab active' : 'auth-tab'}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && <div className="error-banner">{authError}</div>}

              <button
                className="primary-button"
                type="submit"
                disabled={authLoading}
              >
                {authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </section>
        ) : (
          <section className="chat-layout">
            <aside className="chat-sidebar">
              <div className="sidebar-header">
                <h2>Conversations</h2>
                <button
                  type="button"
                  className="secondary-button small"
                  onClick={() => {
                    setSessionId(generateSessionId())
                    setMessages([])
                  }}
                >
                  New
                </button>
              </div>
              <p className="sidebar-hint">Simple session list placeholder. You can persist this later.</p>
            </aside>

            <section className="chat-panel">
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <h3>Ask anything about your product or docs</h3>
                    <p>The assistant will use your knowledge base and escalate when needed.</p>
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.from === 'user'
                        ? 'message-row message-user'
                        : m.from === 'assistant'
                        ? 'message-row message-assistant'
                        : 'message-row message-system'
                    }
                  >
                    <div className="message-avatar">
                      {m.from === 'user' ? 'You' : m.from === 'assistant' ? 'AI' : '★'}
                    </div>
                    <div className="message-bubble">{m.message}</div>
                  </div>
                ))}

                {chatError && <div className="error-inline">{chatError}</div>}
              </div>

              <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question…"
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={chatLoading || !input.trim()}
                >
                  {chatLoading ? 'Thinking…' : 'Send'}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleEscalate}
                >
                  Escalate
                </button>
              </form>
            </section>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
