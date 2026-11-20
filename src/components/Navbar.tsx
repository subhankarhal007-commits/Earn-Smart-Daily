import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useBlog } from '../context/BlogContext';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, categories } = useBlog();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubscribeClick = () => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      const target = document.getElementById('newsletter');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/#newsletter');
    setTimeout(() => {
      document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const navLinks = [
    { label: 'Latest', to: '/search' },
    { label: 'AI Tools', to: '/category/ai-tools' },
    { label: 'Freelancing', to: '/category/freelancing' },
    { label: 'Passive Income', to: '/category/passive-income' },
    { label: 'Admin', to: '/admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#0B1B34] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          aria-label={settings.siteName}
        >
          <span
            className="w-7 h-7 bg-[#0B1B34] text-white flex items-center justify-center font-serif text-sm font-semibold tracking-tight"
            aria-hidden="true"
          >
            E
          </span>
          <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#0B1B34] whitespace-nowrap">
            {settings.siteName}
          </span>
        </Link>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          aria-label="Primary navigation"
        >
          {navLinks.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-[#0B1B34] border-emerald-600'
                    : 'border-transparent hover:text-[#0B1B34] hover:border-slate-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA action (+ mobile drawer toggle on small screens) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSubscribeClick}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Subscribe
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-[#0B1B34] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-base font-medium text-[#0B1B34] border-b border-slate-100 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2.5">All Editorial Categories</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-slate-700 hover:text-emerald-700 py-1 truncate"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
