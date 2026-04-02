import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../api'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'

const PAGE_SIZE = 20

export default function CategoryPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [products,  setProducts]  = useState([])
  const [category,  setCategory]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [sort,      setSort]      = useState('latest')
  const [page,      setPage]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Reset page when slug or sort changes
  useEffect(() => { setPage(0) }, [slug, sort])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      // ✅ FIX: use backend category endpoint — no more client-side filtering
      productsAPI.getByCategory(slug, page, PAGE_SIZE),
      categoriesAPI.getBySlug(slug).catch(() => null),
    ]).then(([pR, cR]) => {
      if (cR) setCategory(cR.data.data)
      const paged = pR.data.data
      setProducts(paged.content || [])
      setTotalPages(paged.totalPages || 1)
      setTotalItems(paged.totalElements || 0)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, page])

  useEffect(() => { load() }, [load])

  // Client-side sort on the current page
  const sorted = [...products].sort((a, b) => {
    if (sort === 'price_asc')  return Number(a.price) - Number(b.price)
    if (sort === 'price_desc') return Number(b.price) - Number(a.price)
    return new Date(b.postedDate) - new Date(a.postedDate)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category?.icon}</span>
          <div>
            <h1 className="font-black text-2xl text-slate-900">
              {category?.name || slug}
            </h1>
            <p className="text-sm text-slate-400">{totalItems} listings</p>
          </div>
        </div>
        <div className="ml-auto">
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="input w-auto py-2 text-sm">
            <option value="latest">Latest first</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">{category?.icon || '📦'}</div>
          <h3 className="font-bold text-xl text-slate-600 mb-2">No listings yet</h3>
          <p className="text-slate-400 text-sm mb-5">Be the first to post in this category!</p>
          <button onClick={() => navigate('/sell')} className="btn-primary">Post an Ad</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost p-2 disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(i => i === 0 || i === totalPages - 1 ||
                         Math.abs(i - page) <= 1)
            .reduce((acc, i, idx, arr) => {
              if (idx > 0 && i - arr[idx - 1] > 1) acc.push('…')
              acc.push(i)
              return acc
            }, [])
            .map((item, idx) =>
              item === '…' ? (
                <span key={`gap-${idx}`} className="px-2 text-slate-400">…</span>
              ) : (
                <button key={item} onClick={() => setPage(item)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                    item === page
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}>
                  {item + 1}
                </button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-ghost p-2 disabled:opacity-40">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}