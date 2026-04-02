import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <span className="text-white font-black text-sm">T</span>
              </div>
              <span className="font-black text-lg text-white">Trade<span className="text-orange-400">Nest</span></span>
            </div>
            <p className="text-sm">India's trusted marketplace to buy and sell anything.</p>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/sell', 'Post Ad'], ['/wishlist', 'Wishlist'], ['/dashboard', 'Dashboard']].map(([t, l]) => (
                <li key={t}><Link to={t} className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              {[['cars','Cars'],['phones','Mobiles'],['electronics','Electronics'],['furniture','Furniture'],['fashion','Fashion']].map(([s,l]) => (
                <li key={s}><Link to={`/category/${s}`} className="hover:text-orange-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              {['Help Center','Safety Tips','Privacy Policy','Terms of Service'].map(t => (
                <li key={t} className="cursor-default hover:text-orange-400 transition-colors">{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>© {new Date().getFullYear()} TradeNest. All rights reserved.</p>
          <p>Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  )
}
