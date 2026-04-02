import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Zap, Tag, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react'
import { categoriesAPI, productsAPI } from '../api'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'

const PAGE_SIZE = 20

function ErrorBanner({ error, onRetry }) {
  return (
    <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
      <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-red-800">Backend not reachable</p>
        <p className="text-sm text-red-700 mt-1">
          Make sure Spring Boot is running: <code className="bg-red-100 px-1 rounded">mvn spring-boot:run</code> on port 9000
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button onClick={onRetry} className="flex items-center gap-1.5 text-sm font-bold text-red-700 hover:text-red-900 shrink-0">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [query,    setQuery]    = useState('')
  const [cats,     setCats]     = useState([])
  const [featured, setFeatured] = useState([])
  const [all,      setAll]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,    setError]    = useState('')
  const [page,     setPage]     = useState(0)
  const [hasMore,  setHasMore]  = useState(true)

  const load = () => {
    setLoading(true)
    setError('')
    setPage(0)
    Promise.all([
      categoriesAPI.getAll(),
      productsAPI.getFeatured(),
      productsAPI.getAllPaged(0, PAGE_SIZE),
    ])
      .then(([cR, fR, aR]) => {
        setCats(cR.data.data     || [])
        setFeatured(fR.data.data || [])
        const paged = aR.data.data
        setAll(paged.content || [])
        setHasMore(!paged.last)
        setPage(1)
      })
      .catch(err => {
        const status = err?.response?.status
        setError(status
          ? `${status} — ${err?.response?.data?.message || err.message}`
          : 'Cannot reach backend. Is Spring Boot running on port 9000?'
        )
      })
      .finally(() => setLoading(false))
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const r    = await productsAPI.getAllPaged(page, PAGE_SIZE)
      const data = r.data.data
      setAll(prev => [...prev, ...(data.content || [])])
      setHasMore(!data.last)
      setPage(p => p + 1)
    } catch {} finally { setLoadingMore(false) }
  }

  useEffect(() => { load() }, [])

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Zap size={13} /> India's fastest growing marketplace
          </span>
          <h1 className="font-black text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5">
            Buy &amp; Sell Anything<br />
            <span className="text-orange-400">Near You</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            From cars to electronics — find the best deals in your city, instantly.
          </p>
          {/* ✅ FIX: search now goes to /search?q= (backend-powered) */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden p-1.5 gap-2">
              <div className="flex-1 flex items-center gap-2 pl-4">
                <Search size={17} className="text-slate-400 shrink-0" />
                <input
                  value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="flex-1 text-slate-800 text-sm placeholder-slate-400 focus:outline-none py-2 bg-transparent"
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6 shrink-0">Search</button>
            </div>
          </form>
          <div className="flex items-center justify-center gap-8 mt-10 text-slate-500 text-sm">
            {[['10L+', 'Listings'], ['500+', 'Cities'], ['50L+', 'Users']].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-black text-white">{n}</p>
                <p>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {error && <ErrorBanner error={error} onRetry={load} />}

        {/* Categories */}
        <section className="mb-12">
          <h2 className="font-black text-2xl text-slate-900 mb-5">Browse Categories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card p-4 flex flex-col items-center gap-2">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="skeleton h-3 w-14 rounded" />
                  </div>
                ))
              : cats.map(cat => (
                  <Link key={cat.id} to={`/category/${cat.slug}`}
                    className="card p-4 flex flex-col items-center gap-2 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-[11px] font-bold text-slate-500 text-center leading-tight">{cat.name}</span>
                  </Link>
                ))
            }
          </div>
        </section>

        {/* Featured */}
        {(loading || featured.length > 0) && (
          <section className="mb-12">
            <h2 className="font-black text-2xl text-slate-900 mb-5">⭐ Featured Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </section>
        )}

        {/* Latest listings */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-2xl text-slate-900">Latest Listings</h2>
            <Link to="/search" className="text-sm text-orange-500 hover:underline font-semibold">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : all.length === 0 && !error ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="font-bold text-xl text-slate-600 mb-2">No listings yet</h3>
              <p className="text-slate-400 text-sm mb-5">Be the first to post an ad!</p>
              <button onClick={() => navigate('/sell')} className="btn-secondary">Post Free Ad</button>
            </div>
          ) : !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {all.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* ✅ NEW: Load more button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-secondary px-8 py-3 flex items-center gap-2 disabled:opacity-60"
                  >
                    {loadingMore
                      ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : <ChevronDown size={16} />}
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Sell CTA */}
        {!error && (
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 p-8 sm:p-12 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={18} className="text-orange-200" />
              <span className="text-orange-200 font-bold text-sm">Sell instantly</span>
            </div>
            <h2 className="font-black text-3xl sm:text-4xl mb-3">Got something to sell?</h2>
            <p className="text-orange-100 text-lg mb-6">Post your ad in 60 seconds. Reach thousands of buyers.</p>
            <Link to="/sell" className="inline-flex items-center gap-2 bg-white text-orange-700 font-black px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow">
              Post Free Ad <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}