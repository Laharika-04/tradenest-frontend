import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ChevronDown, Heart, MessageCircle, Plus,
  LogOut, LayoutDashboard, Package, Tag, Menu, X,
  Bookmark, Bell, User, CheckCheck,
} from 'lucide-react'
import { useAuth }          from '../../context/AuthContext'
import { useWishlist }      from '../../context/WishlistContext'
import { useNotifications } from '../../context/NotificationContext'
import { categoriesAPI }    from '../../api'
import { formatDistanceToNow } from 'date-fns'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { ids: wishIds }                  = useWishlist()
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [query,       setQuery]       = useState('')
  const [cats,        setCats]        = useState([])
  const [showCat,     setShowCat]     = useState(false)
  const [showUser,    setShowUser]    = useState(false)
  const [showNotif,   setShowNotif]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const catRef   = useRef(null)
  const userRef  = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    categoriesAPI.getAll()
      .then(r => setCats(r.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const h = e => {
      if (catRef.current   && !catRef.current.contains(e.target))   setShowCat(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Sync search box with URL ?q= param
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || ''
    setQuery(q)
  }, [location.search])

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    else navigate('/')
  }

  const doLogout = () => { logout(); setShowUser(false); navigate('/') }

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f97316&color=fff&size=64&bold=true`

  const handleNotifClick = async (n) => {
    if (!n.read) await markOneRead(n.id)
    setShowNotif(false)
    // Navigate based on notification type
    if (n.type === 'MESSAGE' && n.referenceId) navigate('/chat')
    else if (n.type === 'OFFER' && n.referenceId) navigate('/offers')
    else if (n.referenceId) navigate(`/product/${n.referenceId}`)
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="hidden sm:block font-black text-lg text-slate-900">
              Trade<span className="text-orange-500">Nest</span>
            </span>
          </Link>

          {/* Category dropdown */}
          <div className="relative hidden md:block" ref={catRef}>
            <button
              onClick={() => setShowCat(v => !v)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Categories
              <ChevronDown size={13} className={`transition-transform ${showCat ? 'rotate-180' : ''}`} />
            </button>
            {showCat && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl w-[400px] p-3 grid grid-cols-3 gap-1 z-50">
                {cats.map(c => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    onClick={() => setShowCat(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-700 transition-colors text-sm font-medium"
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search cars, phones, furniture..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/chat" className="btn-ghost p-2.5 hidden sm:flex" title="Messages">
                  <MessageCircle size={20} />
                </Link>

                <Link to="/wishlist" className="relative btn-ghost p-2.5 hidden sm:flex" title="Wishlist">
                  <Heart size={20} />
                  {wishIds.size > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                      {wishIds.size > 9 ? '9+' : wishIds.size}
                    </span>
                  )}
                </Link>

                {/* ✅ NEW: Notification bell */}
                <div className="relative hidden sm:block" ref={notifRef}>
                  <button
                    onClick={() => { setShowNotif(v => !v); if (!showNotif && unreadCount > 0) {} }}
                    className="btn-ghost p-2.5 relative"
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotif && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl w-80 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <p className="font-bold text-slate-900 text-sm">Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead}
                            className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-semibold">
                            <CheckCheck size={13} /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            <Bell size={28} className="mx-auto mb-2 text-slate-200" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 20).map(n => (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-orange-50/60' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-orange-500' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                  {n.createdAt && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/sell" className="btn-primary text-sm ml-1 hidden sm:inline-flex">
                  <Plus size={15} /> Sell
                </Link>

                {/* Avatar dropdown */}
                <div className="relative ml-1" ref={userRef}>
                  <button
                    onClick={() => setShowUser(v => !v)}
                    className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <img src={avatar} alt={user?.name} className="w-8 h-8 rounded-xl object-cover border-2 border-orange-200" />
                    <ChevronDown size={13} className={`hidden sm:block text-slate-400 transition-transform ${showUser ? 'rotate-180' : ''}`} />
                  </button>

                  {showUser && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl w-52 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900 text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          ['/profile',     <User size={14} />,          'My Profile'],
                          ['/my-listings', <Package size={14} />,       'My Listings'],
                          ['/offers',      <Tag size={14} />,           'Offers'],
                          ['/wishlist',    <Bookmark size={14} />,      'Wishlist'],
                          ['/dashboard',   <LayoutDashboard size={14} />, 'Dashboard'],
                        ].map(([to, icon, label]) => (
                          <Link key={to} to={to} onClick={() => setShowUser(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <span className="text-slate-400">{icon}</span>{label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 pt-1">
                        <button onClick={doLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={14} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm hidden sm:flex">Login</Link>
                <Link to="/register" className="btn-secondary text-sm hidden sm:flex">Register</Link>
                <Link to="/sell"     className="btn-primary text-sm hidden sm:inline-flex"><Plus size={15} /> Sell</Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)} className="btn-ghost p-2 sm:hidden">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-100 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                <MobLink to="/sell"        label="+ Sell" primary />
                <MobLink to="/chat"        label="Messages" />
                <MobLink to="/wishlist"    label="Wishlist" />
                <MobLink to="/my-listings" label="My Listings" />
                <MobLink to="/offers"      label="Offers" />
                <MobLink to="/dashboard"   label="Dashboard" />
                <MobLink to="/profile"     label="My Profile" />
                <button onClick={doLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobLink to="/login"    label="Login" />
                <MobLink to="/register" label="Register" />
                <MobLink to="/sell"     label="+ Sell" primary />
              </>
            )}
            <div className="pt-2 border-t border-slate-100">
              <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</p>
              <div className="grid grid-cols-4 gap-1 px-2">
                {cats.slice(0, 8).map(c => (
                  <Link key={c.id} to={`/category/${c.slug}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-orange-50">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[9px] font-bold text-slate-500 text-center leading-tight">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function MobLink({ to, label, primary }) {
  return (
    <Link to={to} className={`block px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${
      primary ? 'bg-orange-500 text-white' : 'text-slate-700 hover:bg-slate-50'
    }`}>{label}</Link>
  )
}