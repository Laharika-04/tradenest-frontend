import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

function safeUser() {
  try { return JSON.parse(localStorage.getItem('tn_user') || 'null') }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(safeUser)
  const [token,   setToken]   = useState(() => localStorage.getItem('tn_token') || null)
  const [loading, setLoading] = useState(true)

  // Forced logout from 401 interceptor
  useEffect(() => {
    const h = () => { setToken(null); setUser(null) }
    window.addEventListener('tn:logout', h)
    return () => window.removeEventListener('tn:logout', h)
  }, [])

  // Verify token on app start
  useEffect(() => {
    if (!token) { setLoading(false); return }
    authAPI.profile()
      .then(r => {
        const u = r.data.data
        setUser(u)
        localStorage.setItem('tn_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('tn_token')
        localStorage.removeItem('tn_user')
        setToken(null); setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login({ email: email.toLowerCase().trim(), password })
    const { token: t, user: u } = r.data.data
    localStorage.setItem('tn_token', t)
    localStorage.setItem('tn_user', JSON.stringify(u))
    setToken(t); setUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    const r = await authAPI.register({ ...data, email: data.email.toLowerCase().trim() })
    const { token: t, user: u } = r.data.data
    localStorage.setItem('tn_token', t)
    localStorage.setItem('tn_user', JSON.stringify(u))
    setToken(t); setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tn_token')
    localStorage.removeItem('tn_user')
    setToken(null); setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token && !!user,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
