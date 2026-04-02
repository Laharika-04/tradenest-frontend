import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, MapPin } from 'lucide-react'
import { wishlistAPI, IMG_HOST, CATEGORY_IMAGES } from '../api'
import { useWishlist } from '../context/WishlistContext'
import toast from 'react-hot-toast'

function itemImg(item) {
  const raw = item.image
  if (!raw || raw === 'sample.jpg' || !raw.trim()) return CATEGORY_IMAGES.default
  const clean = raw.replace(/^\/uploads\//, '').trim()
  if (clean.startsWith('http')) return clean
  return `${IMG_HOST}/uploads/${clean}`
}

export default function WishlistPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const { toggle } = useWishlist()

  const load = () => {
    setLoading(true)
    wishlistAPI.getAll()
      .then(r => setItems(r.data.data || []))
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRemove = async pid => {
    const ok = await toggle(pid)
    if (ok) setItems(prev => prev.filter(i => i.productId !== pid))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <Heart size={20} className="text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-900">My Wishlist</h1>
          <p className="text-slate-400 text-sm">{items.length} saved items</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-[4/3]" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={64} className="text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-600 mb-2">Your wishlist is empty</h3>
          <p className="text-slate-400 text-sm mb-6">Tap the ❤️ on any listing to save it here</p>
          <Link to="/" className="btn-primary">Browse Listings</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => <WishCard key={item.productId} item={item} onRemove={handleRemove} />)}
        </div>
      )}
    </div>
  )
}

function WishCard({ item, onRemove }) {
  const [removing, setRemoving] = useState(false)
  const [imgErr,   setImgErr]   = useState(false)

  const doRemove = async e => {
    e.preventDefault(); e.stopPropagation()
    if (removing) return
    setRemoving(true)
    await onRemove(item.productId)
    setRemoving(false)
  }

  return (
    <Link to={`/product/${item.productId}`} className="block group">
      <div className="card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={imgErr ? CATEGORY_IMAGES.default : itemImg(item)}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
          <button onClick={doRemove} disabled={removing}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow disabled:opacity-60">
            {removing
              ? <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={13} />}
          </button>
        </div>
        <div className="p-3">
          <p className="font-bold text-slate-800 text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
            <MapPin size={11} /><span>{item.city}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
