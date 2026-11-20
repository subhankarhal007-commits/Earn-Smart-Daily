import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderTree,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useBlog } from '../context/BlogContext';
import { useSEO } from '../hooks/useSEO';
import { ArticleEditor } from '../components/admin/ArticleEditorModal';
import {
  formatDisplayDate,
  slugify,
  type AdSlot,
  type Advertisement,
  type Article,
  type Category,
  type SiteSettings,
} from '../types/blog';

type AdminTab = 'overview' | 'articles' | 'categories' | 'ads' | 'settings' | 'audience';

const AD_SLOTS: { value: AdSlot; label: string }[] = [
  { value: 'header-leaderboard', label: 'Header Leaderboard (Homepage Top)' },
  { value: 'homepage-mid', label: 'Homepage Mid-Feed Banner' },
  { value: 'article-sidebar', label: 'Article Sticky Sidebar' },
  { value: 'article-footer', label: 'Article Bottom Banner' },
];

export function AdminDashboardPage() {
  const {
    user,
    authReady,
    isAdmin,
    isOwnerAdmin,
    articles,
    publishedArticles,
    categories,
    advertisements,
    settings,
    subscribers,
    admins,
    signInWithGoogle,
    logout,
    toggleArticleStatus,
    deleteArticle,
    saveCategory,
    deleteCategory,
    saveAdvertisement,
    toggleAdvertisement,
    deleteAdvertisement,
    saveSiteSettings,
    deleteSubscriber,
    addAdminUser,
    removeAdminUser,
  } = useBlog();

  useSEO({
    title: `Admin Dashboard | ${settings.siteName}`,
    description: 'Secure editorial CMS for EarnSmart Daily administrators.',
    canonicalPath: '/admin',
  });

  const [tab, setTab] = useState<AdminTab>('articles');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  // Articles tab state
  const [editingArticle, setEditingArticle] = useState<Article | null | undefined>(undefined);
  const [articleSearch, setArticleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Category form state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState(11);

  // Ad form state
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adSlot, setAdSlot] = useState<AdSlot>('header-leaderboard');
  const [adLabel, setAdLabel] = useState('Advertisement');
  const [adSponsor, setAdSponsor] = useState('');
  const [adHeadline, setAdHeadline] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adCta, setAdCta] = useState('Learn More');
  const [adUrl, setAdUrl] = useState('');
  const [adActive, setAdActive] = useState(true);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);

  // Admin add form
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor'>('editor');

  const showSuccess = (text: string) => {
    setNotice({ type: 'success', text });
    setTimeout(() => setNotice(null), 5000);
  };

  const showError = (err: unknown) => {
    setNotice({
      type: 'error',
      text: err instanceof Error ? err.message : 'Operation could not be completed.',
    });
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      const q = articleSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      );
    });
  }, [articles, articleSearch, statusFilter]);

  const draftCount = useMemo(
    () => articles.filter((a) => a.status === 'draft').length,
    [articles]
  );

  const handleDownloadSitemap = () => {
    const origin = window.location.origin;
    const urls = [
      `  <url>\n    <loc>${origin}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...categories.map(
        (c) =>
          `  <url>\n    <loc>${origin}/category/${c.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
      ...publishedArticles.map(
        (a) =>
          `  <url>\n    <loc>${origin}/article/${a.slug}</loc>\n    <lastmod>${a.publishedAt}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`
      ),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(`Generated live sitemap.xml with ${publishedArticles.length} published articles.`);
  };

  const handleExportSubscribersCsv = () => {
    const rows = [
      ['Email', 'Region', 'Source'].join(','),
      ...subscribers.map((s) =>
        [s.email, s.region, s.source].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'earnsmart-subscribers.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setBusyAction(true);
    try {
      await saveCategory(
        {
          id: editingCatId ?? undefined,
          slug: slugify(catSlug || catName),
          name: catName.trim(),
          description: catDesc.trim(),
          order: Number(catOrder) || 1,
        },
        Boolean(editingCatId)
      );
      showSuccess(editingCatId ? `Updated category “${catName}”.` : `Created category “${catName}”.`);
      setEditingCatId(null);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatOrder(categories.length + 2);
    } catch (err) {
      showError(err);
    } finally {
      setBusyAction(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description);
    setCatOrder(cat.order);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHeadline.trim() || !adSponsor.trim()) return;
    setBusyAction(true);
    try {
      await saveAdvertisement(
        {
          id: editingAdId ?? undefined,
          slot: adSlot,
          label: adLabel.trim() || 'Advertisement',
          sponsorName: adSponsor.trim(),
          headline: adHeadline.trim(),
          description: adDesc.trim(),
          ctaText: adCta.trim() || 'Learn More',
          targetUrl: adUrl.trim() || '/',
          active: adActive,
        },
        Boolean(editingAdId)
      );
      showSuccess(editingAdId ? 'Updated advertisement placement.' : 'Created new advertisement placement.');
      setEditingAdId(null);
      setAdSponsor('');
      setAdHeadline('');
      setAdDesc('');
      setAdCta('Learn More');
      setAdUrl('');
      setAdActive(true);
    } catch (err) {
      showError(err);
    } finally {
      setBusyAction(false);
    }
  };

  const startEditAd = (ad: Advertisement) => {
    setEditingAdId(ad.id);
    setAdSlot(ad.slot);
    setAdLabel(ad.label);
    setAdSponsor(ad.sponsorName);
    setAdHeadline(ad.headline);
    setAdDesc(ad.description);
    setAdCta(ad.ctaText);
    setAdUrl(ad.targetUrl);
    setAdActive(ad.active);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction(true);
    try {
      await saveSiteSettings(settingsForm);
      showSuccess('Website settings saved to Firestore.');
    } catch (err) {
      showError(err);
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim() || !newAdminName.trim()) return;
    setBusyAction(true);
    try {
      await addAdminUser(newAdminUid, newAdminEmail, newAdminName, newAdminRole);
      showSuccess(`Granted ${newAdminRole} access to ${newAdminEmail}.`);
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
    } catch (err) {
      showError(err);
    } finally {
      setBusyAction(false);
    }
  };

  // Loading auth state
  if (!authReady) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="text-sm text-slate-600">Verifying administrator session...</div>
      </main>
    );
  }

  // Unauthenticated Gate
  if (!user) {
    return (
      <main className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B1B34] text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">{settings.siteName}</p>
              <h1 className="font-serif text-2xl font-semibold text-[#0B1B34]">
                Editorial Admin Login
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Sign in with your authorized Google account to manage articles, SEO metadata,
            categories, advertisements, and global site settings.
          </p>

          <button
            type="button"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                showError(err);
              }
            }}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Sign in with Google
          </button>

          {notice?.type === 'error' && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3">
              {notice.text}
            </p>
          )}

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Protected by Firebase Authentication and Firestore Security Rules. Public visitors can
            only read published articles.
          </p>
        </div>
      </main>
    );
  }

  // Authenticated but NOT authorized admin
  if (!isAdmin) {
    return (
      <main className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white border border-slate-200 p-8 space-y-5">
          <div className="flex items-center gap-3 text-rose-700">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="font-serif text-2xl font-semibold text-[#0B1B34]">
              Administrator Access Required
            </h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            You are signed in as <strong className="text-[#0B1B34]">{user.email}</strong>, which is
            not currently listed as an authorized administrator for {settings.siteName}.
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
            Account UID: {user.uid}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-slate-800 cursor-pointer"
            >
              Sign out & switch account
            </button>
            <Link
              to="/"
              className="px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Return to Blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'ads', label: 'Advertisements', icon: Megaphone },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'audience', label: 'Subscribers & Access', icon: Users },
  ];

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar (256px) */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div className="p-5">
          <div className="pb-4 mb-4 border-b border-slate-200">
            <p className="text-xs font-semibold text-emerald-700">CMS Workspace</p>
            <p className="font-serif text-lg font-semibold text-[#0B1B34]">{settings.siteName}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setEditingArticle(undefined);
                    if (item.id === 'settings') setSettingsForm(settings);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0B1B34] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1B34]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-slate-200 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-emerald-700 py-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Website</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-rose-700 py-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Top Contextual Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#0B1B34] capitalize">{tab}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {tab !== 'articles' || editingArticle === undefined ? (
              <button
                type="button"
                onClick={() => {
                  setTab('articles');
                  setEditingArticle(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Article</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 text-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="p-6 max-w-6xl space-y-6">
          {/* Status Toast */}
          {notice && (
            <div
              className={`p-4 border text-sm flex items-center justify-between gap-4 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === 'success' && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                <span>{notice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Published Posts', value: publishedArticles.length },
                  { label: 'Saved Drafts', value: draftCount },
                  { label: 'Categories', value: categories.length },
                  {
                    label: 'Active Ad Slots',
                    value: advertisements.filter((a) => a.active).length,
                  },
                  { label: 'Subscribers', value: subscribers.length },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-200 p-5">
                    <p className="text-xs text-slate-500 mb-1.5">{stat.label}</p>
                    <p className="font-mono text-2xl font-medium text-[#0B1B34] tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 space-y-4">
                  <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                    SEO & Indexing Tools
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Generate an updated XML sitemap containing every live published article URL and
                    category route for Google Search Console submission.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadSitemap}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Live sitemap.xml</span>
                    </button>
                    <a
                      href="/robots.txt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <span>Inspect robots.txt</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 space-y-3">
                  <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                    Recent Articles
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {articles.slice(0, 4).map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0B1B34] truncate">{a.title}</p>
                          <p className="text-xs text-slate-500">
                            {a.categoryName} · {a.status === 'published' ? 'Published' : 'Draft'} ·{' '}
                            {formatDisplayDate(a.publishedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTab('articles');
                            setEditingArticle(a);
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTICLES */}
          {tab === 'articles' &&
            (editingArticle !== undefined ? (
              <ArticleEditor
                initialArticle={editingArticle}
                onClose={() => setEditingArticle(undefined)}
                onSaved={showSuccess}
              />
            ) : (
              <div className="bg-white border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      placeholder="Filter articles by title, slug, or category..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 text-[#0B1B34] focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div className="inline-flex border border-slate-200 bg-slate-50 p-0.5 text-xs">
                    {(['all', 'published', 'draft'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 font-medium capitalize cursor-pointer ${
                          statusFilter === st
                            ? 'bg-white text-[#0B1B34] shadow-xs'
                            : 'text-slate-600 hover:text-[#0B1B34]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="font-medium text-[#0B1B34] line-clamp-1">{art.title}</p>
                            <p className="text-xs font-mono text-slate-500 truncate">
                              /article/{art.slug}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                            {art.categoryName}
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                art.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {art.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            {formatDisplayDate(art.publishedAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await toggleArticleStatus(art);
                                    showSuccess(
                                      art.status === 'published'
                                        ? `Moved “${art.title}” to Drafts.`
                                        : `Published “${art.title}”.`
                                    );
                                  } catch (err) {
                                    showError(err);
                                  }
                                }}
                                className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:border-[#0B1B34] cursor-pointer"
                              >
                                {art.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                              <Link
                                to={`/article/${art.slug}`}
                                className="p-1.5 border border-slate-200 text-slate-600 hover:text-emerald-700"
                                title="View article"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setEditingArticle(art)}
                                className="p-1.5 border border-slate-200 text-slate-600 hover:text-[#0B1B34] cursor-pointer"
                                title="Edit article"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === art.id ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await deleteArticle(art.id);
                                      setConfirmDeleteId(null);
                                      showSuccess(`Deleted “${art.title}”.`);
                                    } catch (err) {
                                      showError(err);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-700 text-white font-semibold cursor-pointer"
                                >
                                  Confirm
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(art.id)}
                                  className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                                  title="Delete article"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredArticles.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-14 px-6 text-center">
                            <p className="font-serif text-lg font-semibold text-[#0B1B34] mb-1.5">
                              {articles.length === 0
                                ? 'No articles written yet'
                                : 'No articles match your filter'}
                            </p>
                            <p className="text-xs text-slate-500 mb-5">
                              {articles.length === 0
                                ? 'Create your first post with your own writing and featured image — only what you publish will appear on the website.'
                                : 'Try clearing your search or switching status filter.'}
                            </p>
                            {articles.length === 0 && (
                              <button
                                type="button"
                                onClick={() => setEditingArticle(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Write Your First Post</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

          {/* TAB 3: CATEGORIES */}
          {tab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveCategory}
                className="lg:col-span-5 bg-white border border-slate-200 p-6 space-y-4"
              >
                <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                  {editingCatId ? 'Edit Category' : 'Add New Category'}
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCatId) setCatSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Creator Economy"
                    className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={catSlug}
                      onChange={(e) => setCatSlug(slugify(e.target.value))}
                      placeholder="creator-economy"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={catOrder}
                      onChange={(e) => setCatOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Editorial Description
                  </label>
                  <textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Shown on the category archive header and meta description."
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={busyAction}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                  >
                    {editingCatId ? 'Update Category' : 'Save Category'}
                  </button>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setCatName('');
                        setCatSlug('');
                        setCatDesc('');
                      }}
                      className="px-3 py-2 text-xs border border-slate-300 text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-7 bg-white border border-slate-200 divide-y divide-slate-200">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 tabular-nums">
                          #{cat.order}
                        </span>
                        <p className="font-medium text-sm text-[#0B1B34]">{cat.name}</p>
                        <span className="text-xs font-mono text-slate-500">/{cat.slug}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditCategory(cat)}
                        className="p-1.5 border border-slate-200 text-slate-600 hover:text-[#0B1B34] cursor-pointer"
                        title="Edit category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteCategory(cat.id);
                            showSuccess(`Removed category “${cat.name}”.`);
                          } catch (err) {
                            showError(err);
                          }
                        }}
                        className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADVERTISEMENTS */}
          {tab === 'ads' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveAd}
                className="lg:col-span-5 bg-white border border-slate-200 p-6 space-y-4"
              >
                <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                  {editingAdId ? 'Edit Ad Placement' : 'Create Ad Placement'}
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slot Position
                  </label>
                  <select
                    value={adSlot}
                    onChange={(e) => setAdSlot(e.target.value as AdSlot)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-[#0B1B34]"
                  >
                    {AD_SLOTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Disclosure Label
                    </label>
                    <input
                      type="text"
                      required
                      value={adLabel}
                      onChange={(e) => setAdLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sponsor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adSponsor}
                      onChange={(e) => setAdSponsor(e.target.value)}
                      placeholder="Partner Brand"
                      className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={adHeadline}
                    onChange={(e) => setAdHeadline(e.target.value)}
                    placeholder="Concise value proposition..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supporting Copy
                  </label>
                  <textarea
                    rows={2}
                    value={adDesc}
                    onChange={(e) => setAdDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CTA Label
                    </label>
                    <input
                      type="text"
                      required
                      value={adCta}
                      onChange={(e) => setAdCta(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination URL
                    </label>
                    <input
                      type="text"
                      required
                      value={adUrl}
                      onChange={(e) => setAdUrl(e.target.value)}
                      placeholder="https://... or /article/..."
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 text-[#0B1B34]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adActive}
                    onChange={(e) => setAdActive(e.target.checked)}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span>Active on public website</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={busyAction}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
                  >
                    {editingAdId ? 'Update Placement' : 'Save Placement'}
                  </button>
                  {editingAdId && (
                    <button
                      type="button"
                      onClick={() => setEditingAdId(null)}
                      className="px-3 py-2 text-xs border border-slate-300 text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-7 bg-white border border-slate-200 divide-y divide-slate-200">
                {advertisements.map((ad) => (
                  <div key={ad.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-slate-500">{ad.slot}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#0B1B34]">{ad.sponsorName}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            ad.active ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {ad.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#0B1B34]">{ad.headline}</p>
                      <p className="text-xs text-slate-600">{ad.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await toggleAdvertisement(ad);
                            showSuccess(
                              ad.active ? `Paused ${ad.sponsorName}.` : `Activated ${ad.sponsorName}.`
                            );
                          } catch (err) {
                            showError(err);
                          }
                        }}
                        className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:border-[#0B1B34] cursor-pointer"
                      >
                        {ad.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditAd(ad)}
                        className="p-1.5 border border-slate-200 text-slate-600 hover:text-[#0B1B34] cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteAdvertisement(ad.id);
                            showSuccess(`Deleted ad placement for ${ad.sponsorName}.`);
                          } catch (err) {
                            showError(err);
                          }
                        }}
                        className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WEBSITE SETTINGS */}
          {tab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 p-6 space-y-6 max-w-3xl"
            >
              <div className="pb-3 border-b border-slate-200">
                <h2 className="font-serif text-xl font-semibold text-[#0B1B34]">
                  Website Settings & Global SEO
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Updates live branding, homepage hero messaging, newsletter copy, and default
                  search engine metadata across the site.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.siteName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homepage Hero Headline
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.heroHeadline}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homepage Hero Subheadline
                </label>
                <textarea
                  rows={2}
                  required
                  value={settingsForm.heroSubheadline}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubheadline: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default SEO Title
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.defaultSeoTitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, defaultSeoTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Editorial Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settingsForm.contactEmail}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Meta Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={settingsForm.defaultMetaDescription}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, defaultMetaDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Newsletter Section Title
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.newsletterTitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, newsletterTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Newsletter Description
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.newsletterDescription}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, newsletterDescription: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    X / Twitter URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.twitterUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, twitterUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.linkedinUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.youtubeUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busyAction}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
              >
                {busyAction ? 'Saving Settings...' : 'Save Website Settings'}
              </button>
            </form>
          )}

          {/* TAB 6: SUBSCRIBERS & ADMIN ACCESS */}
          {tab === 'audience' && (
            <div className="space-y-6">
              {/* Newsletter Subscribers */}
              <div className="bg-white border border-slate-200">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                      Newsletter Subscribers ({subscribers.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      PII-isolated in Firestore — readable strictly by authorized administrators.
                    </p>
                  </div>
                  {subscribers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportSubscribersCsv}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 text-[#0B1B34] hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                </div>

                {subscribers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                          <th className="py-2.5 px-4">Email</th>
                          <th className="py-2.5 px-4">Region</th>
                          <th className="py-2.5 px-4">Source</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {subscribers.map((sub) => (
                          <tr key={sub.id}>
                            <td className="py-3 px-4 font-medium text-[#0B1B34]">{sub.email}</td>
                            <td className="py-3 px-4 text-slate-600">{sub.region}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{sub.source}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteSubscriber(sub.id);
                                    showSuccess(`Removed ${sub.email}.`);
                                  } catch (err) {
                                    showError(err);
                                  }
                                }}
                                className="text-slate-500 hover:text-rose-700 cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-6 text-sm text-slate-500">
                    No newsletter subscribers recorded yet. Submissions from the homepage or article
                    sidebar appear here in real time.
                  </p>
                )}
              </div>

              {/* Admin Access Registry */}
              {isOwnerAdmin && (
                <div className="bg-white border border-slate-200 p-6 space-y-5">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#0B1B34]">
                      Authorized Administrators
                    </h2>
                    <p className="text-xs text-slate-500">
                      Grant editorial CMS permissions to verified Firebase Auth user UIDs.
                    </p>
                  </div>

                  <form
                    onSubmit={handleAddAdmin}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-5 border-b border-slate-200"
                  >
                    <input
                      type="text"
                      required
                      value={newAdminUid}
                      onChange={(e) => setNewAdminUid(e.target.value)}
                      placeholder="Firebase User UID"
                      className="sm:col-span-3 px-3 py-2 text-xs font-mono border border-slate-300"
                    />
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="editor@domain.com"
                      className="sm:col-span-3 px-3 py-2 text-xs border border-slate-300"
                    />
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Full Name"
                      className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300"
                    />
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'editor')}
                      className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 bg-white"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={busyAction}
                      className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 cursor-pointer"
                    >
                      Add Admin
                    </button>
                  </form>

                  <div className="divide-y divide-slate-100 text-xs">
                    {admins.map((adm) => (
                      <div key={adm.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[#0B1B34]">
                            {adm.name} · <span className="text-emerald-700 capitalize">{adm.role}</span>
                          </p>
                          <p className="text-slate-500 font-mono">
                            {adm.email} (UID: {adm.id})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await removeAdminUser(adm.id);
                              showSuccess(`Revoked access for ${adm.email}.`);
                            } catch (err) {
                              showError(err);
                            }
                          }}
                          className="text-rose-700 hover:underline cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                    {admins.length === 0 && (
                      <p className="py-2 text-slate-500">
                        Only the primary owner account ({user.email}) currently holds admin access.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
