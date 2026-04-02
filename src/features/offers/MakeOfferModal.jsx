import { useState } from 'react'
import { X, Tag, CheckCircle } from 'lucide-react'
import { offersAPI, fmtPrice } from '../../api'
import toast from 'react-hot-toast'

export default function MakeOfferModal({ product, onClose }) {
  const [amount,  setAmount]  = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const listing = Number(product.price)

  const handleSubmit = async e => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)    { toast.error('Enter a valid amount'); return }
    if (amt > listing * 1.1) { toast.error('Offer too high'); return }
    setLoading(true)
    try {
      await offersAPI.make({ productId: product.id, amount: amt, message: message.trim() || null })
      setDone(true)
      setTimeout(() => { onClose(); toast.success('Offer sent!') }, 1600)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send offer')
    } finally { setLoading(false) }
  }

  const pct = amount && listing ? Math.round(((listing - parseFloat(amount)) / listing) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Tag size={17} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Make an Offer</h2>
              <p className="text-xs text-slate-400">Listed at {fmtPrice(listing)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="font-black text-xl text-slate-900 mb-1">Offer Sent!</h3>
            <p className="text-slate-500 text-sm">The seller will respond soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="label">Your offer (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount" className="input pl-8 text-lg font-bold" autoFocus />
              </div>
              <div className="flex gap-2 mt-2">
                {[90, 80, 70].map(p => {
                  const v = Math.round(listing * p / 100)
                  return (
                    <button type="button" key={p} onClick={() => setAmount(String(v))}
                      className="flex-1 py-1.5 text-xs font-bold bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-600 rounded-lg transition-colors">
                      {p}% · {fmtPrice(v)}
                    </button>
                  )
                })}
              </div>
              {amount && pct > 0 && <p className="text-xs text-orange-600 font-bold mt-1">{pct}% off listing price</p>}
            </div>
            <div>
              <label className="label">Message <span className="normal-case font-normal text-slate-300">(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={200}
                placeholder="Why are you making this offer?" className="input resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading || !amount || parseFloat(amount) <= 0}
                className="btn-primary flex-1 disabled:opacity-50">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Send Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
