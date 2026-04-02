import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsAPI, categoriesAPI, citiesAPI } from '../api'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'

const PAGE_SIZE = 20

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Read filters from URL
  const qParam        = searchParams.get('q')        || ''
  const cityParam     = searchParams.get('city')     || ''
  const categoryParam = searchParams.get('category') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''
  const sortParam     = searchParams.get('sort')     || 'latest'
  const pageParam     = parseInt(searchParams.get('page') || '0', 10)

  const [query,      setQuery]      = useState(qParam)
  const [city,       setCity]       = useState(cityParam)
  const [category,   setCategory]   = useState(categoryParam)
  const [minPrice,   setMinPrice]   = useState(minPriceParam)
  const [maxPrice,   setMaxPrice]   = useState(maxPriceParam)
  const [sort,       setSort]       = useState(sortParam)

  const [products,   setProducts]   = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [cats,       setCats]       = useState([])
  const [cities,     setCities]     = useState([])
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCats(r.data.data || [])).catch(() => {})
    citiesAPI.getAll().then(r => setCities(r.data.data || [])).catch(() => {})
  }, [])

  const doSearch = useCallback(() => {
    if (!qParam && !cityParam && !categoryParam && !minPriceParam && !maxPriceParam) {
      setProducts([]); setTotalItems(0); return
    }
    setLoading(true)
    productsAPI.search({
      q:        qParam        || undefined,
      city:     cityParam     || undefined,
      category: categoryParam || undefined,
      minPrice: minPriceParam || undefined,
      maxPrice: maxPriceParam || undefined,
      page:     pageParam,
      size:     PAGE_SIZE,
    }).then(r => {
      const data = r.data.data
      let content = data.content || []
      // Client-side sort on current page
      if (sort === 'price_asc')  content = [...content].sort((a,b) => Number(a.price)-Number(b.price))
      if (sort === 'price_desc') content = [...content].sort((a,b) => Number(b.price)-Number(a.price))
      setProducts(content)
      setTotalPages(data.totalPages || 1)
      setTotalItems(data.totalElements || 0)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [qParam, cityParam, categoryParam, minPriceParam, maxPriceParam, pageParam, sort])

  useEffect(() => { doSearch() }, [doSearch])

  // Sync local state with URL
  useEffect(() => {
    setQuery(qParam); setCity(cityParam); setCategory(categoryParam)
    setMinPrice(minPriceParam); setMaxPrice(maxPriceParam); setSort(sortParam)
  }, [searchParams])

  const applyFilters = (e) => {
    e && e.preventDefault()
    const p = {}
    if (query.trim())   p.q        = query.trim()
    if (city)           p.city     = city
    if (category)       p.category = category
    if (minPrice)       p.minPrice = minPrice
    if (maxPrice)       p.maxPrice = maxPrice
    if (sort !== 'latest') p.sort  = sort
    p.page = 0
    setSearchParams(p)
    setShowFilter(false)
  }

  const clearAll = () => {
    setQuery(''); setCity(''); setCategory('')
    setMinPrice(''); setMaxPrice(''); setSort('latest')
    setSearchParams({})
  }

  const goPage = (p) => {
    const params = Object.fromEntries(searchParams.entries())
    params.page = p
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilters = [
    cityParam     && `City: ${cityParam}`,
    categoryParam && `Category: ${cats.find(c=>c.slug===categoryParam)?.name || categoryParam}`,
    minPriceParam && `Min: ₹${minPriceParam}`,
    maxPriceParam && `Max: ₹${maxPriceParam}`,
  ].filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Search bar */}
      <form onSubmit={applyFilters} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
        <button type="button" onClick={() => setShowFilter(v => !v)}
          className={`btn-secondary px-4 flex items-center gap-2 ${showFilter ? 'bg-orange-50 border-orange-300' : ''}`}>
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </button>
      </form>

      {/* Filter panel */}
      {showFilter && (
        <div className="card p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label text-xs mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input py-2 text-sm">
                <option value="">All categories</option>
                {cats.map(c => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs mb-1">City</label>
              <select value={city} onChange={e => setCity(e.target.value)} className="input py-2 text-sm">
                <option value="">All cities</option>
                {cities.map(c => <option key={c.id} value={c.city}>{c.city}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs mb-1">Min Price (₹)</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                placeholder="0" className="input py-2 text-sm" min="0" />
            </div>
            <div>
              <label className="label text-xs mb-1">Max Price (₹)</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                placeholder="Any" className="input py-2 text-sm" min="0" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div>
              <label className="label text-xs mb-1">Sort by</label>
              <select value={sort} onChange={e => setSort(e.target.value)} className="input py-2 text-sm w-auto">
                <option value="latest">Latest first</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5 ml-auto">
              <button type="button" onClick={clearAll} className="btn-secondary text-sm">Clear all</button>
              <button type="button" onClick={applyFilters} className="btn-primary text-sm">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f} className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              {f}
            </span>
          ))}
          <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-200">
            <X size={11} /> Clear all
          </button>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-xl text-slate-900">
          {qParam ? `Results for "${qParam}"` : 'All Listings'}
          {!loading && <span className="ml-2 text-slate-400 font-normal text-base">({totalItems})</span>}
        </h2>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : !qParam && !cityParam && !categoryParam && !minPriceParam && !maxPriceParam ? (
        <div className="text-center py-24">
          <Search size={56} className="text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-600 mb-2">Search for something</h3>
          <p className="text-slate-400 text-sm">Type a keyword above to find listings</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-xl text-slate-600 mb-2">No results found</h3>
          <p className="text-slate-400 text-sm mb-5">Try different keywords or clear your filters</p>
          <button onClick={clearAll} className="btn-secondary">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button onClick={() => goPage(pageParam - 1)} disabled={pageParam === 0}
            className="btn-ghost p-2 disabled:opacity-40"><ChevronLeft size={18} /></button>
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(i => i === 0 || i === totalPages-1 || Math.abs(i-pageParam) <= 1)
            .reduce((acc, i, idx, arr) => {
              if (idx > 0 && i - arr[idx-1] > 1) acc.push('…')
              acc.push(i); return acc
            }, [])
            .map((item, idx) => item === '…'
              ? <span key={`g${idx}`} className="px-2 text-slate-400">…</span>
              : <button key={item} onClick={() => goPage(item)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                    item === pageParam ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}>{item+1}</button>
            )}
          <button onClick={() => goPage(pageParam + 1)} disabled={pageParam >= totalPages-1}
            className="btn-ghost p-2 disabled:opacity-40"><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}