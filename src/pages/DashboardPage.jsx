import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, Heart, Star, Plus, ArrowRight } from 'lucide-react'
import { dashboardAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user }    = useAuth()
  const [stats,     setStats]   = useState(null)
  const [loading,   setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.get()
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f97316&color=fff&size=128&bold=true`

  const statCards = stats ? [
    { label: 'Total Listings',  value: stats.totalProducts,      icon: <Package size={20} />, color: 'bg-blue-50 text-blue-600',   link: '/my-listings' },
    { label: 'Offers Received', value: stats.totalOffersReceived,icon: <Tag size={20} />,     color: 'bg-purple-50 text-purple-600', link: '/offers' },
    { label: 'Wishlist Saves',  value: stats.totalWishlistCount, icon: <Heart size={20} />,   color: 'bg-red-50 text-red-500',       link: '/wishlist' },
    { label: 'Reviews',         value: stats.totalReviews,       icon: <Star size={20} />,    color: 'bg-amber-50 text-amber-500',   link: '#' },
  ] : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <LayoutDashboard size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-900">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your seller overview</p>
        </div>
      </div>

      {/* Profile banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <img src={avatar} alt={user?.name} className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover" />
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-xl">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-slate-400">{user?.city}, {user?.state}</span>
              {user?.verified && <span className="badge bg-green-500/20 text-green-400">✓ Verified</span>}
            </div>
          </div>
          {stats && stats.totalReviews > 0 && (
            <div className="text-right hidden sm:block">
              <div className="flex justify-end">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={15} className={s <= Math.round(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                ))}
              </div>
              <p className="text-slate-400 text-xs mt-1">{stats.averageRating} avg · {stats.totalReviews} reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton w-11 h-11 rounded-xl" />
              <div className="skeleton h-7 w-16 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(card => (
            <Link key={card.label} to={card.link}
              className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <p className="font-black text-3xl text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
              <div className="flex items-center gap-1 text-xs text-orange-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                View <ArrowRight size={10} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
          <span className="text-orange-500">↗</span> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/sell',        label: 'Post New Ad',   sub: 'List an item',     icon: <Plus size={18} />,       primary: true },
            { to: '/my-listings', label: 'My Listings',   sub: 'Manage your ads',  icon: <Package size={18} /> },
            { to: '/offers',      label: 'Manage Offers', sub: 'Accept or reject', icon: <Tag size={18} /> },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                a.primary
                  ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                  : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                a.primary ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {a.icon}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{a.label}</p>
                <p className="text-xs text-slate-400">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
