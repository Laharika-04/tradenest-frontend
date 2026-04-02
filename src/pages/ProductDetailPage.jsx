import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Eye, Shield,
  MessageCircle, Tag, Star, ChevronLeft, ChevronRight,
  User, Package, CheckCircle,
} from 'lucide-react'
import {
  productsAPI, reviewsAPI, messagesAPI,
  getProductImage, fmtPrice, IMG_HOST, CATEGORY_IMAGES,
} from '../api'
import { useAuth }     from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import MakeOfferModal from '../features/offers/MakeOfferModal'
import ProductCard    from '../components/ProductCard'

const CONDITION_LABELS = {
  NEW:      { label: 'New',       cls: 'bg-green-100 text-green-700' },
  LIKE_NEW: { label: 'Like New',  cls: 'bg-teal-100 text-teal-700' },
  GOOD:     { label: 'Good',      cls: 'bg-blue-100 text-blue-700' },
  FAIR:     { label: 'Fair',      cls: 'bg-amber-100 text-amber-700' },
}

function parseImages(product) {
  if (!product) return []
  const raw = product.images
  if (!raw || raw === 'sample.jpg' || !raw.trim()) {
    return [CATEGORY_IMAGES[product.categorySlug] || CATEGORY_IMAGES.default]
  }
  const urls = raw.split(',').map(f => {
    const c = f.trim()
    if (!c) return null
    if (c.startsWith('http')) return c
    return `${IMG_HOST}/uploads/${c.replace(/^\/uploads\//, '')}`
  }).filter(Boolean)
  return urls.length
    ? urls
    : [CATEGORY_IMAGES[product.categorySlug] || CATEGORY_IMAGES.default]
}

export default function ProductDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isWishlisted, isToggling, toggle } = useWishlist()

  const [product,   setProduct]   = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [stats,     setStats]     = useState(null)
  const [related,   setRelated]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [imgIdx,    setImgIdx]    = useState(0)
  const [imgErrors, setImgErrors] = useState({})
  const [showOffer, setShowOffer] = useState(false)
  const [chatBusy,  setChatBusy]  = useState(false)

  useEffect(() => {
    setLoading(true); setImgIdx(0); setImgErrors({})
    productsAPI.getById(id)
      .then(r => {
        const p = r.data.data
        setProduct(p)
        if (p?.sellerId) {
          Promise.all([
            reviewsAPI.getBySeller(p.sellerId).catch(() => ({ data: { data: [] } })),
            reviewsAPI.getStats(p.sellerId).catch(() => null),
          ]).then(([rR, sR]) => {
            setReviews(rR.data.data || [])
            if (sR) setStats(sR.data.data)
          })
        }
        // ✅ NEW: Load related listings (same category, different product)
        if (p?.categorySlug) {
          productsAPI.getByCategory(p.categorySlug, 0, 8)
            .then(cr => {
              const others = (cr.data.data?.content || []).filter(x => x.id !== p.id)
              setRelated(others.slice(0, 4))
            }).catch(() => {})
        }
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [id])

  const images     = parseImages(product)
  const wishlisted = product ? isWishlisted(product.id) : false
  const toggling   = product ? isToggling(product.id)   : false
  const isOwn      = user?.id === product?.sellerId

  const handleChat = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (isOwn) { toast.error("That's your own listing"); return }
    setChatBusy(true)
    try {
      await messagesAPI.startConversation({
        productId: product.id,
        sellerId:  product.sellerId,
        message:   `Hi! I'm interested in "${product.title}"`,
      })
    } catch {}
    finally { setChatBusy(false) }
    navigate('/chat')
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: product?.title, url }).catch(() => {})
    else { navigator.clipboard?.writeText(url); toast.success('Link copied!') }
  }

  const imgSrc = i =>
    imgErrors[i]
      ? (CATEGORY_IMAGES[product?.categorySlug] || CATEGORY_IMAGES.default)
      : images[i]

  const sellerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.sellerName || 'U')}&background=f97316&color=fff&size=64&bold=true`
  const conditionInfo = product?.condition ? CONDITION_LABELS[product.condition] : null

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton aspect-[4/3] rounded-2xl" />
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-5 w-full rounded" />
        </div>
        <div className="space-y-4"><div className="skeleton h-48 rounded-2xl" /></div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="font-black text-2xl text-slate-700 mb-4">Product not found</h2>
      <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-fade">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <span>/</span>
        <Link to={`/category/${product.categorySlug}`} className="hover:text-orange-500 transition-colors">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-slate-100">
              <img
                src={imgSrc(imgIdx)} alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImgErrors(p => ({ ...p, [imgIdx]: true }))}
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
              {product.featured && (
                <span className="absolute top-3 left-3 badge bg-orange-500 text-white">⭐ Featured</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === imgIdx ? 'border-orange-500' : 'border-transparent hover:border-slate-300'
                    }`}>
                    <img src={imgSrc(i)} alt="" className="w-full h-full object-cover"
                      onError={() => setImgErrors(p => ({ ...p, [i]: true }))} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-black text-3xl text-slate-900">{fmtPrice(product.price)}</p>
                <h1 className="text-lg font-bold text-slate-800 mt-1">{product.title}</h1>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => !toggling && toggle(product.id)} disabled={toggling}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500'
                  }`}>
                  <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
                </button>
                <button onClick={handleShare}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-400 pb-5 border-b border-slate-100 mb-5">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-orange-500" />{product.city}, {product.state}</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {product.postedDate ? formatDistanceToNow(new Date(product.postedDate), { addSuffix: true }) : ''}
              </span>
              {product.viewCount > 0 && (
                <span className="flex items-center gap-1.5"><Eye size={13} />{product.viewCount} views</span>
              )}
              {product.categoryName && (
                <span className="flex items-center gap-1.5"><Tag size={13} />{product.categoryName}</span>
              )}
              {/* ✅ NEW: Condition badge */}
              {conditionInfo && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${conditionInfo.cls}`}>
                  <CheckCircle size={11} /> {conditionInfo.label}
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-800 mb-2 text-sm">Description</h3>
            <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Safety tips */}
          <div className="card p-5 border-l-4 border-l-orange-400 rounded-l-none">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={17} className="text-orange-500" />
              <h3 className="font-bold text-slate-900 text-sm">Safety Tips</h3>
            </div>
            <ul className="text-sm text-slate-500 space-y-1.5">
              {[
                'Meet in a safe, public location',
                'Check the item before paying',
                'Never pay in advance or send money online',
                'Beware of deals that seem too good to be true',
              ].map(t => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5 shrink-0">•</span>{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Seller Reviews</h3>
                {stats && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= Math.round(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{stats.averageRating}</span>
                    <span className="text-xs text-slate-400">({stats.totalReviews})</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="flex gap-3">
                    <img src="https://ui-avatars.com/api/?name=User&background=e2e8f0&color=64748b&size=32&bold=true" alt="" className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ NEW: Related listings */}
          {related.length > 0 && (
            <div>
              <h3 className="font-black text-xl text-slate-900 mb-4">Similar Listings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Seller card */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <p className="font-black text-2xl text-slate-900 mb-1">{fmtPrice(product.price)}</p>
            <p className="text-sm text-slate-500 mb-4">{product.title}</p>

            {!isOwn ? (
              <div className="space-y-2.5">
                <button onClick={handleChat} disabled={chatBusy}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                  {chatBusy
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><MessageCircle size={16} /> Chat with Seller</>}
                </button>
                {isAuthenticated && (
                  <button onClick={() => setShowOffer(true)}
                    className="btn-secondary w-full justify-center py-3">
                    <Tag size={16} /> Make an Offer
                  </button>
                )}
              </div>
            ) : (
              <Link to={`/sell/edit/${product.id}`}
                className="btn-secondary w-full justify-center py-3 flex items-center gap-2">
                <Package size={16} /> Edit Listing
              </Link>
            )}

            <div className="border-t border-slate-100 my-4" />

            {/* Seller info — ✅ FIX: link now goes to /seller/:id */}
            <div className="flex items-center gap-3">
              <img src={sellerAvatar} alt={product.sellerName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{product.sellerName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={10} />{product.sellerCity}
                </p>
                {product.sellerVerified && (
                  <span className="badge bg-green-100 text-green-700 text-[10px] mt-0.5">✓ Verified</span>
                )}
              </div>
              {/* ✅ FIX: correct route /seller/:id */}
              <Link to={`/seller/${product.sellerId}`}
                className="btn-ghost text-xs px-3 py-1.5 shrink-0">
                <User size={12} /> Profile
              </Link>
            </div>

            {stats && stats.totalReviews > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className={s <= Math.round(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
                <span className="text-xs text-slate-500">
                  {stats.averageRating} · {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOffer && <MakeOfferModal product={product} onClose={() => setShowOffer(false)} />}
    </div>
  )
}