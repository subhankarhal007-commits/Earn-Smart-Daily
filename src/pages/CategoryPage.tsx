import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useBlog } from '../context/BlogContext';
import { useSEO } from '../hooks/useSEO';
import { AdPlacement } from '../components/AdPlacement';
import { ArticleCard } from '../components/ArticleCard';
import { NewsletterSection } from '../components/NewsletterSection';

type SortOption = 'latest' | 'popular' | 'shortest';

export function CategoryPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { publishedArticles, categories, settings } = useBlog();

  const initialQuery = searchParams.get('q') ?? '';
  const [queryText, setQueryText] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  useEffect(() => {
    setQueryText(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const currentCategory = useMemo(
    () => (slug ? categories.find((c) => c.slug === slug) : undefined),
    [categories, slug]
  );

  const pageTitle = currentCategory
    ? `${currentCategory.name} Guides | ${settings.siteName}`
    : queryText.trim()
      ? `Search: ${queryText.trim()} | ${settings.siteName}`
      : `All Online Earning Articles & Archive | ${settings.siteName}`;

  const pageDescription = currentCategory
    ? currentCategory.description
    : `Browse all published guides across ${categories.length} online earning categories on ${settings.siteName}.`;

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonicalPath: slug ? `/category/${slug}` : '/search',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: currentCategory?.name ?? 'EarnSmart Daily Archive',
      description: pageDescription,
      url: `${window.location.origin}${slug ? `/category/${slug}` : '/search'}`,
    },
  });

  const filteredArticles = useMemo(() => {
    let list = publishedArticles;
    if (slug) {
      list = list.filter((a) => a.categorySlug === slug);
    }

    const q = queryText.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.categoryName.toLowerCase().includes(q) ||
          a.authorName.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const sorted = [...list];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'shortest') {
      sorted.sort((a, b) => a.readingTime - b.readingTime);
    } else {
      sorted.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    }
    return sorted;
  }, [publishedArticles, slug, queryText, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryText.trim();
    if (slug) {
      navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
    } else {
      setSearchParams(trimmed ? { q: trimmed } : {});
    }
  };

  return (
    <main className="bg-white">
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link to="/" className="hover:text-[#0B1B34]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-emerald-700">
              {currentCategory ? currentCategory.name : 'Archive & Search'}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B1B34] mb-3">
                {currentCategory
                  ? currentCategory.name
                  : queryText.trim()
                    ? `Results for “${queryText.trim()}”`
                    : 'Editorial Archive'}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                {currentCategory
                  ? currentCategory.description
                  : 'Search and filter every published playbook across AI tools, freelancing, affiliate marketing, passive income, and remote careers.'}
              </p>
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-stretch border border-slate-300 bg-white focus-within:border-emerald-700"
              >
                <div className="flex items-center pl-3.5 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="search"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Search articles, topics, or authors..."
                  aria-label="Search archive"
                  className="flex-1 px-3 py-2.5 text-sm text-[#0B1B34] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* All 10 Categories Navigation Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-8 mt-8 border-t border-slate-200">
            <Link
              to="/search"
              className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                !slug
                  ? 'bg-[#0B1B34] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  slug === cat.slug
                    ? 'bg-[#0B1B34] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
          <p className="text-sm text-slate-600 tabular-nums">
            Showing <strong className="font-semibold text-[#0B1B34]">{filteredArticles.length}</strong>{' '}
            {filteredArticles.length === 1 ? 'article' : 'articles'}
          </p>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sort by:</span>
            <div className="inline-flex border border-slate-200 bg-slate-50 p-0.5">
              {(
                [
                  { id: 'latest', label: 'Latest' },
                  { id: 'popular', label: 'Most Read' },
                  { id: 'shortest', label: 'Quickest Read' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id)}
                  className={`px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-white text-[#0B1B34] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1B34]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="standard" />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-slate-200 bg-slate-50">
            <p className="font-serif text-xl text-[#0B1B34] mb-2">
              No matching articles found
            </p>
            <p className="text-sm text-slate-600 mb-6">
              Try broadening your search terms or exploring another earning vertical.
            </p>
            <button
              type="button"
              onClick={() => {
                setQueryText('');
                navigate('/search');
              }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        <div className="mt-14">
          <AdPlacement slot="homepage-mid" variant="horizontal" />
        </div>
      </section>

      <NewsletterSection source={slug ? `category:${slug}` : 'archive'} />
    </main>
  );
}
