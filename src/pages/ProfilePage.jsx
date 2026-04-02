import { useState, useEffect } from 'react'
import { User, Camera, Save, Lock, MapPin, Phone, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI, citiesAPI, uploadFile, IMG_HOST } from '../api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuth()

  const [cities,    setCities]    = useState([])
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab,       setTab]       = useState('profile') // 'profile' | 'password'

  const [form, setForm] = useState({
    name: '', phone: '', city: '', state: '', avatarUrl: '',
  })
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirm: '',
  })
  const [pwErrors, setPwErrors] = useState({})

  useEffect(() => {
    if (user) {
      setForm({
        name:      user.name      || '',
        phone:     user.phone     || '',
        city:      user.city      || '',
        state:     user.state     || '',
        avatarUrl: user.avatarUrl || '',
      })
    }
  }, [user])

  useEffect(() => {
    citiesAPI.getAll()
      .then(r => setCities(r.data.data || []))
      .catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCity = e => {
    const name  = e.target.value
    const found = cities.find(c => c.city === name)
    setForm(f => ({ ...f, city: name, state: found?.state || f.state }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }
    setUploading(true)
    try {
      const res = await uploadFile(file)
      const url = res.data.data || ''
      setForm(f => ({ ...f, avatarUrl: url }))
      toast.success('Photo uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally { setUploading(false) }
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const r = await authAPI.updateProfile({
        name:      form.name.trim(),
        phone:     form.phone.replace(/\D/g, ''),
        city:      form.city,
        state:     form.state,
        avatarUrl: form.avatarUrl,
      })
      const updated = r.data.data
      localStorage.setItem('tn_user', JSON.stringify(updated))
      window.dispatchEvent(new Event('tn:profile-updated'))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  // FIX: Send both currentPassword and newPassword to backend in one call.
  // Previously the frontend was re-logging in with the current password (broken
  // approach — it issued a new JWT unnecessarily and didn't actually change the
  // password if the backend didn't support it).
  const handlePasswordChange = async e => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword)               errs.currentPassword = 'Required'
    if (pwForm.newPassword.length < 6)         errs.newPassword     = 'Min 6 characters'
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm         = 'Passwords do not match'
    setPwErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await authAPI.updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      setPwErrors({})
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Current password is incorrect')
    } finally { setSaving(false) }
  }

  // FIX: Use IMG_HOST constant instead of hardcoded localhost:9000
  const avatarSrc = form.avatarUrl
    ? (form.avatarUrl.startsWith('http')
        ? form.avatarUrl
        : `${IMG_HOST}/uploads/${form.avatarUrl.replace(/^\/uploads\//, '')}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=f97316&color=fff&size=128&bold=true`

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <User size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-900">My Profile</h1>
          <p className="text-slate-400 text-sm">Manage your account details</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[['profile', 'Profile Info'], ['password', 'Change Password']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>{label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
            <div className="relative">
              <img
                src={avatarSrc}
                alt={form.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-100"
              />
              <label className={`absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploading
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera size={14} />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="font-black text-lg text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {user?.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 font-semibold">
                  ✓ Verified account
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.name} onChange={set('name')} placeholder="Your name"
                  className="input pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.phone} onChange={set('phone')} placeholder="10-digit mobile"
                  maxLength={10} inputMode="numeric" className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={user?.email || ''} disabled className="input pl-10 opacity-60 cursor-not-allowed" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="label">City</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={form.city} onChange={handleCity} className="input pl-10">
                  <option value="">Select city</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.city}>{c.city}, {c.state}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="btn-primary w-full py-3 disabled:opacity-60 mt-2">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card p-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className={`input pl-10 ${pwErrors.currentPassword ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              </div>
              {pwErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.currentPassword}</p>}
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min 6 characters"
                  className={`input pl-10 ${pwErrors.newPassword ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              </div>
              {pwErrors.newPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.newPassword}</p>}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className={`input pl-10 ${pwErrors.confirm ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              </div>
              {pwErrors.confirm && <p className="text-red-500 text-xs mt-1">{pwErrors.confirm}</p>}
            </div>

            <button type="submit" disabled={saving}
              className="btn-primary w-full py-3 disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Lock size={15} /> Change Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}