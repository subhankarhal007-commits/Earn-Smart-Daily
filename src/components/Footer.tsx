import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';

export function Footer() {
  const { settings, categories } = useBlog();
  const half = Math.ceil(categories.length / 2);
  const firstCol = categories.slice(0, half);
  const secondCol = categories.slice(half);

  return (
    <footer className="bg-[#0B1B34] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Global Edition */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="w-7 h-7 bg-emerald-600 text-white flex items-center justify-center font-serif text-sm font-semibold">
                E
              </span>
              <span className="font-serif text-xl font-semibold tracking-tight">
                {settings.siteName}
              </span>
            </Link>
            <p className="text-sm font-medium text-emerald-400 tracking-wide">
              {settings.tagline}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Independent journalism and actionable online income research crafted for ambitious
              readers across the United States, United Kingdom, Canada, Australia, India, and
              worldwide.
            </p>
            <p className="text-xs text-slate-400 pt-1">
              Global Editions · USA · UK · Canada · Australia · India
            </p>
          </div>

          {/* Categories Column 1 */}
          <div className="lg:col-span-3">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white uppercase mb-4">
              Core Topics
            </h3>
            <ul className="space-y-2.5 text-sm">
              {firstCol.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Column 2 */}
          <div className="lg:col-span-3">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white uppercase mb-4">
              Growth Tracks
            </h3>
            <ul className="space-y-2.5 text-sm">
              {secondCol.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Publication & Resources */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white uppercase mb-4">
              Publication
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="text-slate-300 hover:text-emerald-400 transition-colors">
                  Archive & Search
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-300 hover:text-emerald-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  XML Sitemap
                </a>
              </li>
              <li>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Robots.txt
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-slate-300 hover:text-emerald-400 transition-colors break-all"
                >
                  Editorial Desk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved. Editorial content is
            for educational purposes; affiliate links are transparently disclosed.
          </p>
          <div className="flex items-center gap-5">
            {settings.twitterUrl && (
              <a
                href={settings.twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                X / Twitter
              </a>
            )}
            {settings.linkedinUrl && (
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            )}
            {settings.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
