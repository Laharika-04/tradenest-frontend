import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center page-fade">
        <p className="font-black text-9xl text-slate-200 leading-none select-none">404</p>
        <h1 className="font-black text-2xl text-slate-900 mt-2 mb-3">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft size={15} /> Go Back
          </button>
          <Link to="/" className="btn-primary">
            <Home size={15} /> Home
          </Link>
        </div>
      </div>
    </div>
  )
}
