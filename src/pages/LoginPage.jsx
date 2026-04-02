import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/'

  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email'
    if (!pass) e.pass = 'Password required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handle = async ev => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, pass)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-fade">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <h1 className="font-black text-2xl text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your TradeNest account</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handle} noValidate className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`input ${errors.email ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Your password"
                  className={`input pr-10 ${errors.pass ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pass && <p className="text-red-500 text-xs mt-1">{errors.pass}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link to="/register" className="text-orange-600 font-bold hover:underline">Register free</Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm">
          <p className="font-bold text-orange-800 mb-1">Demo accounts</p>
          <p className="text-orange-700">seller1@tn.com / password123</p>
          <p className="text-orange-700">seller2@tn.com / password123</p>
          <p className="text-orange-700">seller3@tn.com / password123</p>
        </div>
      </div>
    </div>
  )
}
