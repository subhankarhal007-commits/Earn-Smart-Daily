import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PenSquare, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useBlog } from '../context/BlogContext';
import { useSEO } from '../hooks/useSEO';
import { AdPlacement } from '../components/AdPlacement';
import { ArticleCard } from '../components/ArticleCard';
import { EditorialImage } from '../components/EditorialImage';
import { NewsletterSection } from '../components/NewsletterSection';
import { formatDisplayDate } from '../types/blog';

export function HomePage() {
  const { publishedArticles, categories, settings, loading } = useBlog();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const homeJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.siteName,
      description: settings.defaultMetaDescription,
      url: window.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
    [settings]
  );

  useSEO({
    title: settings.defaultSeoTitle,
    description: settings.defaultMetaDescription,
    canonicalPath: '/',
    ogType: 'website',
    ogImage: publishedArticles[0]?.featuredImage,
    jsonLd: homeJsonLd,
  });

  const leadArticle = useMemo(
    () => publishedArticles.find((a) => a.isFeatured) ?? publishedArticles[0],
    [publishedArticles]
  );

  const trendingArticles = useMemo(() => {
    const flagged = publishedArticles.filter((a) => a.isTrending);
    return (flagged.length > 0 ? flagged : publishedArticles).slice(0, 4);
  }, [publishedArticles]);

  const latestFiltered = useMemo(() => {
    const base =
      selectedCategory === 'all'
        ? publishedArticles
        : publishedArticles.filter((a) => a.categorySlug === selectedCategory);
    return base.slice(0, 9);
  }, [publishedArticles, selectedCategory]);

  const aiArticles = useMemo(
    () => publishedArticles.filter((a) => a.categorySlug === 'ai-tools').slice(0, 3),
    [publishedArticles]
  );

  const freelancingArticles = useMemo(
    () =>
      publishedArticles
        .filter((a) => ['freelancing', 'side-hustles', 'make-money-online'].includes(a.categorySlug))
        .slice(0, 3),
    [publishedArticles]
  );

  const passiveArticles = useMemo(
    () =>
      publishedArticles
        .filter((a) => ['passive-income', 'digital-products'].includes(a.categorySlug))
        .slice(0, 3),
    [publishedArticles]
  );

  const affiliateArticles = useMemo(
    () =>
      publishedArticles
        .filter((a) => ['affiliate-marketing', 'blogging-seo'].includes(a.categorySlug))
        .slice(0, 3),
    [publishedArticles]
  );

  const wfhArticles = useMemo(
    () =>
      publishedArticles
        .filter((a) => ['work-from-home', 'online-business'].includes(a.categorySlug))
        .slice(0, 3),
    [publishedArticles]
  );

  const quickSearchMatches = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (q.length < 2) return [];
    return publishedArticles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.categoryName.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [searchInput, publishedArticles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <main className="bg-white">
      {/* 1. Editorial Hero & Search Section */}
      <section className="border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch"
          >
            {/* Left Column: Headline, Tagline, Search Bar */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div className="space-y-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-emerald-700">
                  {settings.tagline} · Global Online Earning Journal
                </p>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold tracking-tight text-[#0B1B34] leading-[1.08]">
                  {settings.heroHeadline}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {settings.heroSubheadline}
                </p>

                {/* Functional Search Bar */}
                <div className="relative pt-2 max-w-xl">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-stretch border border-slate-300 bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15 transition-shadow"
                  >
                    <label htmlFor="hero-search" className="sr-only">
                      Search published articles
                    </label>
                    <div className="flex items-center pl-4 text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      id="hero-search"
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search articles, topics, or keywords..."
                      className="flex-1 px-3 py-3.5 text-sm text-[#0B1B34] placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Search
                    </button>
                  </form>

                  {quickSearchMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg z-30 divide-y divide-slate-100">
                      {quickSearchMatches.map((item) => (
                        <Link
                          key={item.slug}
                          to={`/article/${item.slug}`}
                          className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-medium text-emerald-700 mb-0.5">
                            {item.categoryName} · {item.readingTime} min read
                          </p>
                          <p className="font-serif text-sm font-semibold text-[#0B1B34] line-clamp-1">
                            {item.title}
                          </p>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#0B1B34] bg-slate-50 hover:text-emerald-700 cursor-pointer"
                      >
                        View all search results for “{searchInput}”
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-mono text-base font-medium text-[#0B1B34] tabular-nums">
                    {publishedArticles.length}
                  </p>
                  <p className="text-slate-500 mt-0.5">Published posts</p>
                </div>
                <div>
                  <p className="font-mono text-base font-medium text-[#0B1B34] tabular-nums">
                    {categories.length}
                  </p>
                  <p className="text-slate-500 mt-0.5">Editorial topics</p>
                </div>
                <div>
                  <p className="font-mono text-base font-medium text-[#0B1B34] tabular-nums">
                    Global
                  </p>
                  <p className="text-slate-500 mt-0.5">US · UK · CA · AU · IN</p>
                </div>
              </div>
            </div>

            {/* Right Column: Lead Feature OR Clean First-Post Welcome Card */}
            <div className="lg:col-span-6 flex">
              {loading ? (
                <div className="w-full min-h-[340px] bg-slate-100 animate-pulse border border-slate-200" />
              ) : leadArticle ? (
                <article className="group w-full bg-white border border-slate-200 flex flex-col justify-between">
                  <Link to={`/article/${leadArticle.slug}`} className="block overflow-hidden">
                    <EditorialImage
                      src={leadArticle.featuredImage}
                      alt={leadArticle.title}
                      aspectClass="aspect-[16/10]"
                      priority
                    />
                  </Link>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                        <span className="font-semibold text-emerald-700">Featured Post</span>
                        <span aria-hidden="true">/</span>
                        <Link
                          to={`/category/${leadArticle.categorySlug}`}
                          className="font-medium text-[#0B1B34] hover:text-emerald-700"
                        >
                          {leadArticle.categoryName}
                        </Link>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{leadArticle.readingTime} min read</span>
                      </div>
                      <Link to={`/article/${leadArticle.slug}`} className="block">
                        <h2 className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-[#0B1B34] leading-snug group-hover:text-emerald-700 transition-colors mb-3">
                          {leadArticle.title}
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {leadArticle.subtitle}
                        </p>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        By <strong className="font-medium text-[#0B1B34]">{leadArticle.authorName}</strong> ·{' '}
                        {formatDisplayDate(leadArticle.publishedAt)}
                      </span>
                      <Link
                        to={`/article/${leadArticle.slug}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                      >
                        <span>Read post</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="w-full bg-white border border-slate-200 p-8 sm:p-10 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
                    Ready to Publish
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34] leading-snug mb-3">
                    Your blog is clean and ready for your first post
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-7">
                    Only articles you write and publish from the Admin Panel will appear here along
                    with your uploaded featured images.
                  </p>
                  <div>
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span>Open Admin Panel & Write Post</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Active Header Leaderboard Ad (Only shown if active in Admin Panel) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 empty:hidden">
        <AdPlacement slot="header-leaderboard" variant="horizontal" />
      </div>

      {/* Latest Blog Posts (Shows strictly user-published articles) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-1">Published Articles</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
              Latest Blog Posts
            </h2>
          </div>
          {publishedArticles.length > 0 && (
            <Link
              to="/search"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Browse full archive</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 border-b border-slate-200"
          role="tablist"
          aria-label="Filter latest articles by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0B1B34] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[#0B1B34] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : latestFiltered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {latestFiltered.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="standard" />
            ))}
          </div>
        ) : (
          <div className="py-16 px-6 text-center border border-slate-200 bg-slate-50/70">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0B1B34] mb-2">
              {selectedCategory === 'all'
                ? 'No published posts yet'
                : 'No posts in this category yet'}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              {selectedCategory === 'all'
                ? 'Log in to the Admin Panel to write, upload featured images, and publish your articles.'
                : 'Switch back to All Topics or publish a new post in this category from your Admin Panel.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2.5 text-xs font-semibold border border-slate-300 bg-white text-[#0B1B34] hover:bg-slate-100 cursor-pointer"
                >
                  Show All Topics
                </button>
              )}
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>Write a Post in Admin</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Trending Articles (Only renders when user has published articles) */}
      {trendingArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-slate-200">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1">Highlighted Reads</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                Trending Articles
              </h2>
            </div>
            <Link
              to="/search"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>All articles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingArticles.map((article, idx) => (
              <article key={article.slug} className="group flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2.5 mb-3.5">
                    <span className="font-mono text-2xl font-medium text-emerald-700 tabular-nums">
                      0{idx + 1}
                    </span>
                    <Link
                      to={`/category/${article.categorySlug}`}
                      className="text-xs font-medium text-slate-500 hover:text-[#0B1B34]"
                    >
                      {article.categoryName}
                    </Link>
                  </div>
                  <Link to={`/article/${article.slug}`} className="block">
                    <h3 className="font-serif text-lg font-semibold text-[#0B1B34] leading-snug group-hover:text-emerald-700 transition-colors mb-2.5">
                      {article.title}
                    </h3>
                  </Link>
                </div>
                <div className="text-xs text-slate-500 pt-2 flex items-center gap-2">
                  <span>{article.authorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{article.readingTime} min read</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* AI Tools Spotlight (Only renders when AI Tools posts exist) */}
      {aiArticles.length > 0 && (
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-end justify-between gap-4 mb-9">
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">
                  Automation & Productivity
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                  AI Tools & Earning
                </h2>
              </div>
              <Link
                to="/category/ai-tools"
                className="text-sm font-medium text-[#0B1B34] hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>All AI Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {aiArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} variant="standard" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Mid-Feed Ad (Only shown if active in Admin Panel) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 empty:hidden">
        <AdPlacement slot="homepage-mid" variant="horizontal" />
      </div>

      {/* Freelancing & Passive Income Spread (Renders once posts exist in either track) */}
      {(freelancingArticles.length > 0 || passiveArticles.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {freelancingArticles.length > 0 && (
              <div className="lg:col-span-6 lg:pr-6 lg:border-r lg:border-slate-200">
                <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-[#0B1B34] mb-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">
                      Independent Careers
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                      Freelancing Guides
                    </h2>
                  </div>
                  <Link
                    to="/category/freelancing"
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {freelancingArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="compact" />
                ))}
              </div>
            )}

            {passiveArticles.length > 0 && (
              <div className="lg:col-span-6">
                <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-[#0B1B34] mb-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">
                      Compounding Assets
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                      Passive Income Ideas
                    </h2>
                  </div>
                  <Link
                    to="/category/passive-income"
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {passiveArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="compact" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Affiliate Marketing & SEO (Renders when posts exist) */}
      {affiliateArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1">
                Publishing & Commissions
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                Affiliate Marketing & SEO Guides
              </h2>
            </div>
            <Link
              to="/category/affiliate-marketing"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>All affiliate guides</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {affiliateArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="horizontal" />
            ))}
          </div>
        </section>
      )}

      {/* Work From Home & Online Business (Renders when posts exist) */}
      {wfhArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between gap-4 mb-9">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1">
                Remote Careers & Solo Ventures
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                Work From Home & Online Business
              </h2>
            </div>
            <Link
              to="/category/work-from-home"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Explore remote guides</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {wfhArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Subscription Band */}
      <NewsletterSection source="homepage" />
    </main>
  );
}
