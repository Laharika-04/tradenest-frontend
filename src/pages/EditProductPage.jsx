import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { productsAPI, categoriesAPI, citiesAPI } from '../api'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [fetching, setFetching] = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [cats,     setCats]     = useState([])
  const [cities,   setCities]   = useState([])
  const [form,     setForm]     = useState({
    title: '', description: '', price: '',
    city: '', state: '', categoryId: '', featured: false,
  })

  useEffect(() => {
    Promise.all([
      productsAPI.getById(id),
      categoriesAPI.getAll(),
      citiesAPI.getAll(),
    ]).then(([pR, cR, ciR]) => {
      const p = pR.data.data
      setForm({
        title:       p.title       || '',
        description: p.description || '',
        price:       p.price       || '',
        city:        p.city        || '',
        state:       p.state       || '',
        // ✅ Use flat DTO field: p.categoryId instead of p.category?.id
        categoryId:  p.categoryId  || '',
        featured:    p.featured    || false,
      })
      setCats(cR.data.data    || [])
      setCities(ciR.data.data || [])
    })
    .catch(() => toast.error('Failed to load product'))
    .finally(() => setFetching(false))
  }, [id])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCity = e => {
    const name  = e.target.value
    const found = cities.find(c => c.city === name)
    setForm(f => ({ ...f, city: name, state: found?.state || '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim() || !form.price || parseFloat(form.price) <= 0) {
      toast.error('Fill in title and a valid price')
      return
    }
    setSaving(true)
    try {
      await productsAPI.update(id, {
        title:       form.title.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        city:        form.city,
        state:       form.state,
        featured:    form.featured,
        category:    { id: parseInt(form.categoryId) },
      })
      toast.success('Listing updated!')
      navigate(`/product/${id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded-xl" />
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-2xl text-slate-900">Edit Listing</h1>
          <p className="text-slate-400 text-sm">Update your ad details</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select value={form.categoryId} onChange={set('categoryId')} className="input">
              <option value="">Select category</option>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Honda City 2019"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Describe your item..."
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="label">Price (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={set('price')}
                placeholder="0"
                className="input pl-8 text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="label">City</label>
            <select value={form.city} onChange={handleCity} className="input">
              <option value="">Select city</option>
              {cities.map(c => (
                <option key={c.id} value={c.city}>{c.city}, {c.state}</option>
              ))}
            </select>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Mark as Featured listing
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}