import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function MainLayout() {
  const { pathname } = useLocation()
  const noFooter = pathname.startsWith('/chat') || pathname.startsWith('/sell')
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-fade"><Outlet /></main>
      {!noFooter && <Footer />}
    </div>
  )
}
