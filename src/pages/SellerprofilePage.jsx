import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Star, Package, MessageCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { productsAPI, reviewsAPI, messagesAPI, IMG_HOST } from '../api'
import { useAuth } from '../context/AuthContext'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function SellerProfilePage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [products, setProducts] = useState([])
  const [reviews,  setReviews]  = useState([])
  const [stats,    setStats]    = useState(null)
  const [seller,   setSeller]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      productsAPI.getBySeller(id),
      reviewsAPI.getBySeller(id),
      reviewsAPI.getStats(id),
    ]).then(([pR, rR, sR]) => {
      const prods = pR.data.data || []
      setProducts(prods)
      setReviews(rR.data.data  || [])
      setStats(sR.data.data)

      // Extract seller info from first product if available
      if (prods.length > 0) {
        setSeller({
          id:        prods[0].sellerId,
          name:      prods[0].sellerName,
          city:      prods[0].sellerCity,
          avatarUrl: prods[0].sellerAvatarUrl,
          verified:  prods[0].sellerVerified,
        })
      }
      // FIX: If no products, seller info comes back as null — show a graceful fallback
      // (seller name shown as "Seller" with a generic avatar)
    }).catch(() => toast.error('Could not load seller'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChat = async (productId) => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (String(user?.id) === String(id)) { toast.error("That's your own profile"); return }
    setChatBusy(true)
    try {
      await messagesAPI.startConversation({
        productId,
        sellerId: Number(id),
        message:  `Hi! I'm interested in your listing.`,
      })
    } catch {}
    finally { setChatBusy(false) }
    navigate('/chat')
  }

  // FIX: Use IMG_HOST constant instead of hardcoded localhost:9000
  const avatar = seller?.avatarUrl
    ? `${IMG_HOST}/uploads/${seller.avatarUrl.replace(/^\/uploads\//, '')}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'S')}&background=f97316&color=fff&size=128&bold=true`

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="skeleton h-48 rounded-2xl mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="btn-ghost p-2 mb-5">
        <ArrowLeft size={20} />
      </button>

      {/* Seller banner */}
      <div className="card p-6 mb-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img src={avatar} alt={seller?.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-2xl text-slate-900">{seller?.name || 'Seller'}</h1>
              {seller?.verified && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck size={11} /> Verified
                </span>
              )}
            </div>
            {seller?.city && (
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <MapPin size={13} /> {seller.city}
              </p>
            )}
            {stats && stats.totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={
                      s <= Math.round(stats.averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    } />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-700">{stats.averageRating}</span>
                <span className="text-xs text-slate-400">({stats.totalReviews} reviews)</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <div className="text-center px-4 py-2 bg-slate-50 rounded-xl">
              <p className="font-black text-xl text-slate-900">{products.length}</p>
              <p className="text-xs text-slate-400">Listings</p>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 rounded-xl">
              <p className="font-black text-xl text-slate-900">{stats?.totalReviews || 0}</p>
              <p className="text-xs text-slate-400">Reviews</p>
            </div>
            {isAuthenticated && String(user?.id) !== String(id) && (
              <button
                onClick={() => products.length && handleChat(products[0].id)}
                disabled={chatBusy || !products.length}
                className="btn-primary disabled:opacity-60"
              >
                {chatBusy
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><MessageCircle size={15} /> Message</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <section className="mb-10">
        <h2 className="font-black text-xl text-slate-900 mb-4 flex items-center gap-2">
          <Package size={18} className="text-slate-400" /> Active Listings
        </h2>
        {products.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="font-semibold">No active listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2 className="font-black text-xl text-slate-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400" /> Reviews
          </h2>
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-4 flex gap-4">
                <img
                  src={`https://ui-avatars.com/api/?name=User&background=e2e8f0&color=64748b&size=40&bold=true`}
                  alt="" className="w-10 h-10 rounded-full shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} className={
                          s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        } />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      {r.createdAt
                        ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}