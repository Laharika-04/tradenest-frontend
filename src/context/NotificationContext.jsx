import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationsAPI } from '../api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) { setNotifications([]); setUnreadCount(0); return }
    try {
      const r = await notificationsAPI.getAll()
      const list = r.data.data || []
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.read).length)
    } catch {}
  }, [isAuthenticated])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    if (!isAuthenticated) return
    const id = setInterval(fetchAll, 30000)
    return () => clearInterval(id)
  }, [isAuthenticated, fetchAll])

  useEffect(() => {
    if (!isAuthenticated) { setNotifications([]); setUnreadCount(0) }
  }, [isAuthenticated])

  const markAllRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }, [])

  const markOneRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markOneRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, fetchAll, markAllRead, markOneRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}