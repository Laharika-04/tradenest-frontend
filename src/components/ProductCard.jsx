import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Clock, Eye } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { getProductImage, CATEGORY_IMAGES, fmtPrice } from '../api'
import { formatDistanceToNow } from 'date-fns'

export default function ProductCard({ product }) {
  const { isWishlisted, isToggling, toggle } = useWishlist()
  const [imgFailed, setImgFailed] = useState(false)

  const pid      = product.id
  const liked    = isWishlisted(pid)
  const toggling = isToggling(pid)

  // ✅ getProductImage already reads product.categorySlug (flat DTO field)
  const imgSrc = imgFailed
    ? (CATEGORY_IMAGES[product.categorySlug] || CATEGORY_IMAGES.default)
    : getProductImage(product)

  const handleHeart = async e => {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return
    await toggle(pid)
  }

  const when = product.postedDate
    ? formatDistanceToNow(new Date(product.postedDate), { addSuffix: true })
    : 'Recently'

  return (
    <Link to={`/product/${pid}`} className="block group outline-none">
      <article className="card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden shrink-0">
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgFailed(true)}
            loading="lazy"
            crossOrigin="anonymous"
          />
          {product.featured && (
            <span className="absolute top-2 left-2 badge bg-orange-500 text-white text-[9px]">
              ⭐ Featured
            </span>
          )}
          <button
            onClick={handleHeart}
            disabled={toggling}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all
              ${toggling ? 'opacity-60 cursor-wait' : ''}
              ${liked
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white'
              }`}
          >
            <Heart size={14} className={liked ? 'fill-white' : ''} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col flex-1">
          <p className="font-black text-lg leading-tight text-slate-900">
            {fmtPrice(product.price)}
          </p>
          <p className="text-sm font-medium text-slate-700 mt-0.5 line-clamp-1">
            {product.title}
          </p>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <MapPin size={11} />
              <span className="truncate max-w-[90px]">{product.city}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock size={11} />{when}
            </span>
          </div>
          {product.viewCount > 0 && (
            <div className="flex items-center gap-1 text-slate-300 text-[10px] mt-1">
              <Eye size={10} />{product.viewCount} views
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-5 w-24 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    </div>
  )
}