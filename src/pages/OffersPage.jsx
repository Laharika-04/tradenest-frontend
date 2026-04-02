import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Check, X, ArrowUpDown } from 'lucide-react'
import { offersAPI, fmtPrice } from '../api'
import toast from 'react-hot-toast'

const STATUS = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800'  },
  ACCEPTED:  { label: 'Accepted',  cls: 'bg-green-100 text-green-800'  },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-100 text-red-700'      },
  COUNTERED: { label: 'Countered', cls: 'bg-blue-100 text-blue-800'    },
}

export default function OffersPage() {
  const [tab,     setTab]     = useState('received')
  const [rec,     setRec]     = useState([])
  const [mine,    setMine]    = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([offersAPI.getReceived(), offersAPI.getMine()])
      .then(([r, m]) => { setRec(r.data.data || []); setMine(m.data.data || []) })
      .catch(() => toast.error('Failed to load offers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (fn, id, label) => {
    setActing(id)
    try { await fn(id); toast.success(label); load() }
    catch (e) { toast.error(e?.response?.data?.message || 'Action failed') }
    finally   { setActing(null) }
  }

  const offers = tab === 'received' ? rec : mine

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <Tag size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-900">Offers</h1>
          <p className="text-slate-400 text-sm">Manage your price negotiations</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[['received', `Received (${rec.length})`], ['mine', `Sent (${mine.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-5 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20">
          <Tag size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-slate-600 mb-2">No offers yet</h3>
          <p className="text-slate-400 text-sm">
            {tab === 'received' ? 'Offers from buyers will appear here' : 'Your sent offers will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const st   = STATUS[offer.status] || STATUS.PENDING
            const busy = acting === offer.id
            return (
              <div key={offer.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shrink-0">
                      <Tag size={20} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      {/* FIX: Show product title instead of "Product #N" */}
                      <Link to={`/product/${offer.productId}`}
                        className="text-sm font-bold text-slate-700 hover:text-orange-500 transition-colors">
                        {offer.productTitle || `Product #${offer.productId}`}
                      </Link>

                      {/* FIX: Show buyer name on received tab */}
                      {tab === 'received' && offer.buyerName && (
                        <p className="text-xs text-slate-400 mt-0.5">from {offer.buyerName}</p>
                      )}

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="font-black text-xl text-slate-900">{fmtPrice(offer.amount)}</span>
                        {offer.counterAmount && (
                          <span className="text-sm text-blue-600 flex items-center gap-1">
                            <ArrowUpDown size={12} /> Counter: {fmtPrice(offer.counterAmount)}
                          </span>
                        )}
                      </div>

                      {/* FIX: message was missing from OfferDto — now shown */}
                      {offer.message && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{offer.message}"</p>
                      )}

                      {tab === 'received' && offer.status === 'PENDING' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => act(offersAPI.accept, offer.id, 'Offer accepted!')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                            {busy ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
                            Accept
                          </button>
                          <button onClick={() => act(offersAPI.reject, offer.id, 'Offer rejected')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                            {busy ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <X size={12} />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`badge shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}