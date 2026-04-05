import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const url    = err.config?.url || ''
    if (status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('tn_token')
      localStorage.removeItem('tn_user')
      window.dispatchEvent(new Event('tn:logout'))
    }
    return Promise.reject(err)
  }
)

export const IMG_HOST = import.meta.env.VITE_API_URL || 'http://localhost:9000'

export const getImageUrl = (raw) => {
  if (!raw || raw === 'sample.jpg' || !raw.trim()) return null
  const clean = raw.replace(/^\/uploads\//, '').trim()
  if (!clean) return null
  if (clean.startsWith('http')) return clean
  return `${IMG_HOST}/uploads/${clean}`
}

export const getFirstImageUrl = (images) => {
  if (!images || images === 'sample.jpg') return null
  const first = images.split(',')[0].trim()
  return getImageUrl(first)
}

export const CATEGORY_IMAGES = {
  cars:          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=75',
  motorcycles:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75',
  phones:        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=75',
  electronics:   'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=75',
  furniture:     'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=75',
  fashion:       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75',
  books:         'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=75',
  laptops:       'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=75',
  pets:          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=75',
  sports:        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=75',
  services:      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=75',
  'real-estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=75',
  default:       'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=75',
}

export const getProductImage = (product) => {
  const uploaded = getFirstImageUrl(product?.images)
  if (uploaded) return uploaded
  const slug = product?.categorySlug || product?.category?.slug || 'default'
  return CATEGORY_IMAGES[slug] || CATEGORY_IMAGES.default
}

export const fmtPrice = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(v) || 0)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (d) => api.post('/auth/register', d),
  login:         (d) => api.post('/auth/login', d),
  profile:       ()  => api.get('/auth/profile'),
  updateProfile: (d) => api.put('/auth/profile', d),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll:      ()                    => api.get('/products'),
  getAllPaged:  (page = 0, size = 20) => api.get(`/products/paged?page=${page}&size=${size}`),
  getById:     (id)                  => api.get(`/products/${id}`),
  getFeatured: ()                    => api.get('/products/featured'),
  getMy:       ()                    => api.get('/products/my'),
  getBySeller: (uid)                 => api.get(`/products/seller/${uid}`),
  create:      (d)                   => api.post('/products', d),
  update:      (id, d)               => api.put(`/products/${id}`, d),
  markAsSold:  (id)                  => api.put(`/products/${id}/sold`),
  delete:      (id)                  => api.delete(`/products/${id}`),

  search: ({ q, city, category, minPrice, maxPrice, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams()
    if (q)        params.set('q', q)
    if (city)     params.set('city', city)
    if (category) params.set('category', category)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    params.set('page', page)
    params.set('size', size)
    return api.get(`/products/search?${params}`)
  },

  getByCategory: (slug, page = 0, size = 20) =>
    api.get(`/products/category/${slug}?page=${page}&size=${size}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll:    ()     => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
}

// ── Cities ────────────────────────────────────────────────────────────────────
export const citiesAPI = {
  getAll:     ()      => api.get('/cities'),
  getByState: (state) => api.get(`/cities/state/${state}`),
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistAPI = {
  getAll: ()    => api.get('/wishlist'),
  add:    (pid) => api.post(`/wishlist/${pid}`),
  remove: (pid) => api.delete(`/wishlist/${pid}`),
  check:  (pid) => api.get(`/wishlist/check/${pid}`),
}

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getConversations:  ()      => api.get('/messages/conversations'),
  getMessages:       (id)    => api.get(`/messages/conversations/${id}`),
  startConversation: (d)     => api.post('/messages/conversations', d),
  sendMessage:       (id, d) => api.post(`/messages/conversations/${id}`, d),
  markRead:          (id)    => api.put(`/messages/conversations/${id}/read`),
}

// ── Offers ────────────────────────────────────────────────────────────────────
export const offersAPI = {
  make:        (d)     => api.post('/offers', d),
  getMine:     ()      => api.get('/offers/mine'),
  getReceived: ()      => api.get('/offers/received'),
  accept:      (id)    => api.put(`/offers/${id}/accept`),
  reject:      (id)    => api.put(`/offers/${id}/reject`),
  counter:     (id, d) => api.put(`/offers/${id}/counter`, d),
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  getBySeller: (sid) => api.get(`/reviews/${sid}`),
  getStats:    (sid) => api.get(`/reviews/${sid}/stats`),
  create:      (d)   => api.post('/reviews', d),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      ()   => api.get('/notifications'),
  getUnread:   ()   => api.get('/notifications/unread-count'),
  markAllRead: ()   => api.put('/notifications/mark-all-read'),
  markOneRead: (id) => api.put(`/notifications/${id}/read`),
}

// ── File upload ───────────────────────────────────────────────────────────────
export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default api