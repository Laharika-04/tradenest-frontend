import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Check, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'
import { categoriesAPI, citiesAPI, productsAPI, uploadFile } from '../api'
import toast from 'react-hot-toast'

const STEPS = ['Category', 'Details', 'Photos', 'Pricing']

const CONDITIONS = [
  { value: 'NEW',      label: 'New',       desc: 'Brand new, unused' },
  { value: 'LIKE_NEW', label: 'Like New',  desc: 'Used once or twice' },
  { value: 'GOOD',     label: 'Good',      desc: 'Some signs of use' },
  { value: 'FAIR',     label: 'Fair',      desc: 'Visible wear, fully working' },
]

export default function SellPage() {
  const navigate = useNavigate()
  const [step,       setStep]       = useState(0)
  const [cats,       setCats]       = useState([])
  const [cities,     setCities]     = useState([])
  const [images,     setImages]     = useState([])
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors,     setErrors]     = useState({})
  const [form,       setForm]       = useState({
    categoryId: '', title: '', description: '', city: '', state: '',
    price: '', featured: false, condition: 'GOOD',
  })

  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), citiesAPI.getAll()])
      .then(([cR, ciR]) => {
        setCats(cR.data.data   || [])
        setCities(ciR.data.data || [])
      }).catch(() => {})
  }, [])

  useEffect(() => () => images.forEach(i => URL.revokeObjectURL(i.preview)), [])

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: '' })) }

  const handleCity = e => {
    const name  = e.target.value
    const found = cities.find(c => c.city === name)
    setForm(f => ({ ...f, city: name, state: found?.state || '' }))
    setErrors(er => ({ ...er, city: '' }))
  }

  const onDrop = useCallback(async accepted => {
    const slots = 5 - images.length
    const files = accepted.slice(0, slots)
    if (!files.length) return
    setUploading(true)
    const results = []
    for (const file of files) {
      const preview = URL.createObjectURL(file)
      try {
        const res = await uploadFile(file)
        const raw = res.data.data || ''
        const serverUrl = raw.replace(/^\/uploads\//, '')
        results.push({ preview, serverUrl })
        toast.success(`Uploaded ${file.name}`)
      } catch {
        URL.revokeObjectURL(preview)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setImages(prev => [...prev, ...results])
    setUploading(false)
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 15 * 1024 * 1024,
    disabled: images.length >= 5 || uploading,
  })

  const removeImage = i => {
    URL.revokeObjectURL(images[i].preview)
    setImages(prev => prev.filter((_, idx) => idx !== i))
  }

  const validateStep = () => {
    if (step === 0 && !form.categoryId) { toast.error('Select a category'); return false }
    if (step === 1) {
      const e = {}
      if (form.title.trim().length < 3)        e.title       = 'At least 3 characters'
      if (form.description.trim().length < 10)  e.description = 'At least 10 characters'
      if (!form.city)                           e.city        = 'Select a city'
      setErrors(e)
      return !Object.keys(e).length
    }
    if (step === 3 && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error('Enter a valid price'); return false
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }
  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    try {
      const imagesStr = images.map(i => i.serverUrl).filter(Boolean).join(',') || 'sample.jpg'
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        city:        form.city,
        state:       form.state,
        featured:    form.featured,
        images:      imagesStr,
        condition:   form.condition,
        category:    { id: parseInt(form.categoryId) },
      }
      const res   = await productsAPI.create(payload)
      const newId = res.data.data?.id
      toast.success('Your ad is live! 🚀')
      navigate(newId ? `/product/${newId}` : '/my-listings')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to post ad')
    } finally { setSubmitting(false) }
  }

  const chosenCat = cats.find(c => c.id == form.categoryId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-black text-3xl text-slate-900">Post an Ad</h1>
        <p className="text-slate-400 text-sm mt-1">List your item for free in minutes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                i < step   ? 'bg-orange-500 text-white' :
                i === step  ? 'bg-slate-900 text-white' :
                              'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold mt-1 ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-orange-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6 page-fade" key={step}>

        {/* Step 0 – Category */}
        {step === 0 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-4 text-sm">Choose a category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {cats.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => { setForm(f => ({ ...f, categoryId: cat.id })); setStep(1) }}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:border-orange-400 hover:bg-orange-50 ${
                    form.categoryId == cat.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                  }`}>
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 – Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-900 mb-1 text-sm">Ad details</h2>
            <div>
              <label className="label">Title *</label>
              <input value={form.title} onChange={set('title')} maxLength={100}
                placeholder="e.g. Honda City 2022 – Single Owner"
                className={`input ${errors.title ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              <div className="flex justify-between mt-1">
                {errors.title ? <p className="text-red-500 text-xs">{errors.title}</p> : <span />}
                <p className="text-xs text-slate-400">{form.title.length}/100</p>
              </div>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={set('description')} rows={5}
                placeholder="Describe your item — condition, features, reason for selling..."
                className={`input resize-none ${errors.description ? 'ring-2 ring-red-400 border-red-300' : ''}`} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            {/* ✅ NEW: Condition field */}
            <div>
              <label className="label">Condition *</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button key={c.value} type="button"
                    onClick={() => setForm(f => ({ ...f, condition: c.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.condition === c.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}>
                    <p className="font-bold text-sm text-slate-800">{c.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">City *</label>
              <select value={form.city} onChange={handleCity}
                className={`input ${errors.city ? 'ring-2 ring-red-400 border-red-300' : ''}`}>
                <option value="">Select city</option>
                {cities.map(c => <option key={c.id} value={c.city}>{c.city}, {c.state}</option>)}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>
        )}

        {/* Step 2 – Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="font-bold text-slate-900 text-sm">Add photos</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <AlertCircle size={11} /> {5 - images.length} slots left
              </span>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 badge bg-orange-500 text-white text-[9px]">Cover</span>
                    )}
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 5 && (
              <div {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
                  isDragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                } ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {uploading
                    ? <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    : <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <Upload size={22} className="text-orange-600" />
                      </div>}
                  <div>
                    <p className="font-bold text-slate-700 text-sm">
                      {uploading ? 'Uploading...' : isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP · max 15 MB</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <AlertCircle size={11} /> Ads with photos get 5× more responses
            </p>
          </div>
        )}

        {/* Step 3 – Pricing */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-bold text-slate-900 mb-1 text-sm">Set your price</h2>
            <div>
              <label className="label">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                <input type="number" value={form.price} onChange={set('price')} min="0" placeholder="0"
                  className="input pl-9 text-lg font-bold" />
              </div>
            </div>
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-orange-300 cursor-pointer transition-colors">
              <input type="checkbox" checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                className="w-4 h-4 accent-orange-500" />
              <div>
                <p className="font-bold text-slate-800 text-sm">⭐ Feature my ad</p>
                <p className="text-xs text-slate-400">Get highlighted placement in results</p>
              </div>
            </label>
            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
              <p className="font-bold text-slate-800 mb-2">Summary</p>
              {[
                ['Category',  chosenCat?.name || '—'],
                ['Title',     form.title || '—'],
                ['Condition', CONDITIONS.find(c => c.value === form.condition)?.label || '—'],
                ['Location',  form.city || '—'],
                ['Photos',    images.length],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-slate-500">
                  <span>{k}</span>
                  <span className="font-semibold text-slate-700 truncate ml-4 max-w-[200px]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7 pt-5 border-t border-slate-100">
          {step > 0 && (
            <button onClick={handleBack} className="btn-secondary flex-1">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="btn-primary flex-1">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary flex-1 disabled:opacity-60">
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Post Ad Free 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}