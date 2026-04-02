import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { citiesAPI } from '../api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [cities,  setCities]  = useState([])
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [form,    setForm]    = useState({
    name: '', email: '', password: '', phone: '', city: '', state: '',
  })

  useEffect(() => {
    citiesAPI.getAll()
      .then(r => setCities(r.data.data || []))
      .catch(() => {
        setCities([
          { id: 1, city: 'Mumbai',    state: 'Maharashtra' },
          { id: 2, city: 'Delhi',     state: 'Delhi'       },
          { id: 3, city: 'Bangalore', state: 'Karnataka'   },
          { id: 4, city: 'Hyderabad', state: 'Telangana'   },
          { id: 5, city: 'Chennai',   state: 'Tamil Nadu'  },
          { id: 6, city: 'Kolkata',   state: 'West Bengal' },
          { id: 7, city: 'Pune',      state: 'Maharashtra' },
          { id: 8, city: 'Ahmedabad', state: 'Gujarat'     },
        ])
      })
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCity = e => {
    const name  = e.target.value
    const found = cities.find(c => c.city === name)
    setForm(f => ({ ...f, city: name, state: found?.state || '' }))
  }

  // ✅ FIX: strip non-digits for both validation AND what gets sent to the API
  const cleanPhone = (raw) => raw.replace(/\D/g, '')

  const validate = () => {
    const e = {}
    if (!form.name.trim())                       e.name     = 'Name required'
    if (!form.email.trim())                      e.email    = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Invalid email'
    if (form.password.length < 6)                e.password = 'Min 6 characters'

    // ✅ FIX: validate against cleaned digits, matching backend regex ^[6-9]\d{9}$
    const digits = cleanPhone(form.phone)
    if (!digits || digits.length !== 10)         e.phone = 'Enter valid 10-digit mobile number'
    else if (!/^[6-9]/.test(digits))             e.phone = 'Number must start with 6, 7, 8 or 9'

    if (!form.city)                              e.city = 'Select your city'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handle = async ev => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // ✅ FIX: send only clean digits to backend
      await register({
        ...form,
        phone: cleanPhone(form.phone),
        email: form.email.toLowerCase().trim(),
      })
      toast.success('Account created! Welcome to TradeNest 🎉')
      navigate('/')
    } catch (e) {
      const msg = e?.response?.data?.message
      toast.error(msg || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-fade">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <h1 className="font-black text-2xl text-slate-900">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join India's fastest marketplace</p>
        </div>

        <div className="card p-7">
          <form onSubmit={handle} noValidate className="space-y-4">

            {/* Name + Phone row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name</label>
                <input
                  value={form.name} onChange={set('name')}
                  placeholder="Rahul Sharma"
                  className={`input ${errors.name ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  value={form.phone} onChange={set('phone')}
                  placeholder="9876543210"
                  maxLength={10}
                  inputMode="numeric"
                  className={`input ${errors.phone ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className={`input ${errors.email ? 'ring-2 ring-red-400 border-red-300' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Min 6 characters"
                  className={`input pr-10 ${errors.password ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* City */}
            <div>
              <label className="label">City</label>
              <select value={form.city} onChange={handleCity}
                className={`input ${errors.city ? 'ring-2 ring-red-400 border-red-300' : ''}`}>
                <option value="">Select your city</option>
                {cities.map(c => (
                  <option key={c.id} value={c.city}>{c.city}, {c.state}</option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              {cities.length === 0 && (
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Loading cities...
                </p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-60">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}