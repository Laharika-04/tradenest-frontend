import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }         from './context/AuthContext'
import { WishlistProvider }     from './context/WishlistContext'
import { NotificationProvider } from './context/NotificationContext'
import MainLayout     from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage           from './pages/HomePage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ProductDetailPage  from './pages/ProductDetailPage'
import CategoryPage       from './pages/CategoryPage'
import SearchPage         from './pages/SearchPage'
import SellPage           from './pages/SellPage'
import EditProductPage    from './pages/EditProductPage'
import WishlistPage       from './pages/WishlistPage'
import ChatPage           from './pages/ChatPage'
import OffersPage         from './pages/OffersPage'
import DashboardPage      from './pages/DashboardPage'
import MyListingsPage     from './pages/MyListingsPage'
import ProfilePage        from './pages/ProfilePage'
import SellerProfilePage  from './pages/SellerProfilePage'
import NotFoundPage       from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <WishlistProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#0f172a',
                  color: '#f8fafc',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  padding: '10px 16px',
                },
                success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/"                  element={<HomePage />} />
                <Route path="/search"            element={<SearchPage />} />
                <Route path="/category/:slug"    element={<CategoryPage />} />
                <Route path="/product/:id"       element={<ProductDetailPage />} />
                <Route path="/seller/:id"        element={<SellerProfilePage />} />
                <Route path="/login"             element={<LoginPage />} />
                <Route path="/register"          element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/sell"            element={<SellPage />} />
                  <Route path="/sell/edit/:id"   element={<EditProductPage />} />
                  <Route path="/wishlist"        element={<WishlistPage />} />
                  <Route path="/chat"            element={<ChatPage />} />
                  <Route path="/offers"          element={<OffersPage />} />
                  <Route path="/dashboard"       element={<DashboardPage />} />
                  <Route path="/my-listings"     element={<MyListingsPage />} />
                  <Route path="/profile"         element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}