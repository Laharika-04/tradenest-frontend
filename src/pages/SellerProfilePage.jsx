import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productsAPI, reviewsAPI, getProductImage, fmtPrice } from '../api'
import { MapPin, Star, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerProfilePage() {
  const { id } = useParams()
  const [products, setProducts] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      productsAPI.getBySeller(id),
      reviewsAPI.getStats(id),
    ])
      .then(([pRes, rRes]) => {
        setProducts(pRes.data.data || [])
        setStats(rRes.data.data || null)
      })
      .catch(() => toast.error('Failed to load seller profile'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-black text-orange-500">S</span>
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-900">Seller Profile</h1>
          {stats && (
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                {stats.averageRating?.toFixed(1) || '0.0'}
                ({stats.totalReviews || 0} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Package size={14} />
                {products.length} listings
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-24">
          <Package size={64} className="text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-600 mb-2">No listings yet</h3>
          <p className="text-slate-400 text-sm">This seller has no active listings</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="block group"
            >
              <div className="card overflow-hidden hover:shadow-lg
                hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition-transform duration-500"
                    onError={e => {
                      e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=75'
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {product.title}
                  </p>
                  <p className="text-orange-500 font-black text-sm mt-1">
                    {fmtPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                    <MapPin size={11} />
                    <span>{product.city}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}