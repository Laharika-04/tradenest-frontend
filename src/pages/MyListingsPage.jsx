import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Plus, Edit2, Trash2, Eye, MapPin, CheckCircle, Tag } from 'lucide-react'
import { productsAPI, getProductImage, fmtPrice, CATEGORY_IMAGES } from '../api'
import toast from 'react-hot-toast'

const STATUS_CLS = {
  ACTIVE:  'bg-green-100 text-green-700',
  SOLD:    'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
}

export default function MyListingsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [selling,  setSelling]  = useState(null)
  const [filter,   setFilter]   = useState('ALL') // ALL | ACTIVE | SOLD | EXPIRED

  const load = () => {
    setLoading(true)
    productsAPI.getMy()
      .then(r => setProducts(r.data.data || []))
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async id => {
    if (!window.confirm('Remove this listing? It will be marked as expired.')) return
    setDeleting(id)
    try {
      await productsAPI.delete(id)
      toast.success('Listing removed')
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'EXPIRED' } : p))
    } catch { toast.error('Could not remove listing') }
    finally  { setDeleting(null) }
  }

  // ✅ NEW: mark as sold
  const handleMarkSold = async id => {
    if (!window.confirm('Mark this item as sold?')) return
    setSelling(id)
    try {
      await productsAPI.markAsSold(id)
      toast.success('Marked as sold!')
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'SOLD' } : p))
    } catch { toast.error('Could not update status') }
    finally  { setSelling(null) }
  }

  const tabs = [
    { key: 'ALL',     label: `All (${products.length})` },
    { key: 'ACTIVE',  label: `Active (${products.filter(p => p.status === 'ACTIVE').length})` },
    { key: 'SOLD',    label: `Sold (${products.filter(p => p.status === 'SOLD').length})` },
    { key: 'EXPIRED', label: `Removed (${products.filter(p => p.status === 'EXPIRED').length})` },
  ]

  const displayed = filter === 'ALL' ? products : products.filter(p => p.status === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-slate-900">My Listings</h1>
            <p className="text-slate-400 text-sm">{products.length} total ads</p>
          </div>
        </div>
        <Link to="/sell" className="btn-primary"><Plus size={15} /> Post New Ad</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4">
              <div className="skeleton w-20 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-48 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24">
          <Package size={64} className="text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-600 mb-2">
            {filter === 'ALL' ? 'No listings yet' : `No ${filter.toLowerCase()} listings`}
          </h3>
          <p className="text-slate-400 text-sm mb-6">Post your first ad and start selling</p>
          {filter === 'ALL' && <Link to="/sell" className="btn-primary">Post Free Ad</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(p => (
            <ListingRow
              key={p.id}
              product={p}
              onDelete={handleDelete}
              onMarkSold={handleMarkSold}
              deleting={deleting === p.id}
              selling={selling === p.id}
              onEdit={() => navigate(`/sell/edit/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingRow({ product: p, onDelete, onMarkSold, deleting, selling, onEdit }) {
  const [imgErr, setImgErr] = useState(false)
  const isActive = p.status === 'ACTIVE'

  return (
    <div className="card p-4 flex gap-4 items-center hover:shadow-md transition-shadow">
      <Link to={`/product/${p.id}`} className="shrink-0">
        <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100">
          <img
            src={imgErr ? CATEGORY_IMAGES.default : getProductImage(p)}
            alt={p.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            onError={() => setImgErr(true)}
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <Link to={`/product/${p.id}`}
            className="font-bold text-slate-800 hover:text-orange-500 transition-colors text-sm truncate max-w-xs">
            {p.title}
          </Link>
          <span className={`badge shrink-0 ${STATUS_CLS[p.status] || STATUS_CLS.EXPIRED}`}>
            {p.status}
          </span>
        </div>
        <p className="font-black text-orange-500 mt-1 text-sm">{fmtPrice(p.price)}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
          <span className="flex items-center gap-1"><MapPin size={10} />{p.city}</span>
          <span className="flex items-center gap-1"><Eye size={10} />{p.viewCount} views</span>
          {p.categoryName && <span className="flex items-center gap-1"><Tag size={10} />{p.categoryName}</span>}
          {p.featured && <span className="text-orange-500 font-semibold">⭐ Featured</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {/* Mark as sold — only for ACTIVE listings */}
        {isActive && (
          <button
            onClick={() => onMarkSold(p.id)}
            disabled={selling}
            title="Mark as Sold"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            {selling
              ? <span className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
              : <CheckCircle size={13} />}
            Sold
          </button>
        )}

        {isActive && (
          <button onClick={onEdit} title="Edit"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors">
            <Edit2 size={14} />
          </button>
        )}

        <button onClick={() => onDelete(p.id)} disabled={deleting || !isActive} title="Remove"
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-40">
          {deleting
            ? <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
            : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  )
}