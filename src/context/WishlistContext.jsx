import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { wishlistAPI } from '../api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [ids,      setIds]      = useState(new Set())   // Set<number>
  const [busyIds,  setBusyIds]  = useState(new Set())   // ids in-flight

  const fetch = useCallback(async () => {
    if (!isAuthenticated) { setIds(new Set()); return }
    try {
      const r = await wishlistAPI.getAll()
      setIds(new Set((r.data.data || []).map(w => Number(w.productId))))
    } catch {}
  }, [isAuthenticated])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!isAuthenticated) setIds(new Set())
  }, [isAuthenticated])

  const isWishlisted = useCallback((pid) => ids.has(Number(pid)), [ids])
  const isToggling   = useCallback((pid) => busyIds.has(Number(pid)), [busyIds])

  const toggle = useCallback(async (pid) => {
    pid = Number(pid)
    if (!isAuthenticated) { toast.error('Login to save to wishlist'); return false }
    if (busyIds.has(pid)) return false
    setBusyIds(p => new Set([...p, pid]))
    const wasIn = ids.has(pid)
    try {
      if (wasIn) {
        await wishlistAPI.remove(pid)
        setIds(p => { const n = new Set(p); n.delete(pid); return n })
        toast.success('Removed from wishlist')
      } else {
        await wishlistAPI.add(pid)
        setIds(p => new Set([...p, pid]))
        toast.success('Saved to wishlist')
      }
      return true
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Wishlist failed')
      return false
    } finally {
      setBusyIds(p => { const n = new Set(p); n.delete(pid); return n })
    }
  }, [isAuthenticated, ids, busyIds])

  return (
    <WishlistContext.Provider value={{ ids, isWishlisted, isToggling, toggle, fetchWishlist: fetch }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be inside WishlistProvider')
  return ctx
}
