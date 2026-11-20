import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  storage,
} from '../lib/firebase';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_CATEGORIES,
} from '../data/seedData';
import {
  estimateReadingTime,
  sanitizeTags,
  SCHEMA_LIMITS,
  slugify,
  type AdminUser,
  type Advertisement,
  type Article,
  type ArticleStatus,
  type Category,
  type SiteSettings,
  type Subscriber,
} from '../types/blog';

interface BlogContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isOwnerAdmin: boolean;
  loading: boolean;
  usingSeedFallback: boolean;
  articles: Article[];
  publishedArticles: Article[];
  categories: Category[];
  advertisements: Advertisement[];
  activeAds: Advertisement[];
  settings: SiteSettings;
  subscribers: Subscriber[];
  admins: AdminUser[];
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  seedDatabase: () => Promise<void>;
  saveArticle: (
    article: Omit<Article, 'id' | 'authorUid' | 'createdAt' | 'updatedAt' | 'views'> & {
      id?: string;
      views?: number;
      authorUid?: string;
    },
    isExisting: boolean
  ) => Promise<string>;
  toggleArticleStatus: (article: Article) => Promise<void>;
  toggleArticleFlags: (
    article: Article,
    flags: { isTrending: boolean; isFeatured: boolean }
  ) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  saveCategory: (
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    isExisting: boolean
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveAdvertisement: (
    ad: Omit<Advertisement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    isExisting: boolean
  ) => Promise<void>;
  toggleAdvertisement: (ad: Advertisement) => Promise<void>;
  deleteAdvertisement: (adId: string) => Promise<void>;
  saveSiteSettings: (nextSettings: SiteSettings) => Promise<void>;
  subscribeNewsletter: (email: string, region: string, source: string) => Promise<void>;
  deleteSubscriber: (subscriberId: string) => Promise<void>;
  addAdminUser: (uid: string, email: string, name: string, role: 'admin' | 'editor') => Promise<void>;
  removeAdminUser: (uid: string) => Promise<void>;
  uploadFeaturedImage: (file: File) => Promise<string>;
  getAdBySlot: (slot: Advertisement['slot']) => Advertisement | undefined;
}

const BlogContext = createContext<BlogContextValue | null>(null);

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnerAdmin, setIsOwnerAdmin] = useState(false);

  const [dbArticles, setDbArticles] = useState<Article[] | null>(null);
  const [dbCategories, setDbCategories] = useState<Category[] | null>(null);
  const [dbAds, setDbAds] = useState<Advertisement[] | null>(null);
  const [dbSettings, setDbSettings] = useState<SiteSettings | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth & Admin Authorization Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setIsAdmin(false);
        setIsOwnerAdmin(false);
        setAuthReady(true);
        return;
      }

      const ownerMatch =
        firebaseUser.emailVerified &&
        firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      setIsOwnerAdmin(ownerMatch);

      if (ownerMatch) {
        setIsAdmin(true);
        setAuthReady(true);
        return;
      }

      if (firebaseUser.emailVerified) {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          setIsAdmin(adminSnap.exists());
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Live Firestore Subscriptions (Public published queries + Owner Admin full queries)
  useEffect(() => {
    if (!authReady) return;

    const articlesQuery = isOwnerAdmin
      ? query(collection(db, 'articles'))
      : query(collection(db, 'articles'), where('status', '==', 'published'));

    const unsubArticles = onSnapshot(
      articlesQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }))
          .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
        setDbArticles(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Articles listener fallback:', err.message);
        setDbArticles([]);
        setLoading(false);
      }
    );

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('order', '>=', 0),
      orderBy('order', 'asc')
    );

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, 'id'>),
        }));
        setDbCategories(list);
      },
      (err) => {
        console.warn('Categories listener fallback:', err.message);
        setDbCategories([]);
      }
    );

    const adsQuery = isOwnerAdmin
      ? query(collection(db, 'advertisements'))
      : query(collection(db, 'advertisements'), where('active', '==', true));

    const unsubAds = onSnapshot(
      adsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Advertisement, 'id'>),
        }));
        setDbAds(list);
      },
      (err) => {
        console.warn('Ads listener fallback:', err.message);
        setDbAds([]);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        if (snap.exists()) {
          setDbSettings(snap.data() as SiteSettings);
        } else {
          setDbSettings(null);
        }
      },
      (err) => {
        console.warn('Settings listener fallback:', err.message);
        setDbSettings(null);
      }
    );

    return () => {
      unsubArticles();
      unsubCategories();
      unsubAds();
      unsubSettings();
    };
  }, [authReady, isOwnerAdmin]);

  // 3. Admin-Only PII Collections (Subscribers & Admin Registry)
  useEffect(() => {
    if (!authReady || !isOwnerAdmin) {
      setSubscribers([]);
      setAdmins([]);
      return;
    }

    const unsubSubscribers = onSnapshot(
      collection(db, 'subscribers'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Subscriber, 'id'>),
        }));
        setSubscribers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'subscribers');
      }
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AdminUser, 'id'>),
        }));
        setAdmins(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'admins');
      }
    );

    return () => {
      unsubSubscribers();
      unsubAdmins();
    };
  }, [authReady, isOwnerAdmin]);

  const usingSeedFallback = false;

  const articles = useMemo(() => dbArticles ?? [], [dbArticles]);

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const categories = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) return dbCategories;
    return SEED_CATEGORIES;
  }, [dbCategories]);

  const advertisements = useMemo(() => dbAds ?? [], [dbAds]);

  const activeAds = useMemo(
    () => advertisements.filter((ad) => ad.active),
    [advertisements]
  );

  const settings = useMemo(() => dbSettings ?? DEFAULT_SITE_SETTINGS, [dbSettings]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const seedDatabase = useCallback(async () => {
    if (!user || !isAdmin) {
      throw new Error('Authorized administrator login is required.');
    }

    const batch = writeBatch(db);

    for (const cat of SEED_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.slug), {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        order: cat.order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'settings', 'site'), {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-init');
    }
  }, [user, isAdmin]);

  const saveArticle: BlogContextValue['saveArticle'] = useCallback(
    async (input, isExisting) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');

      const cleanSlug = slugify(input.slug || input.title);
      if (cleanSlug.length < 2 || !SCHEMA_LIMITS.SLUG_PATTERN.test(cleanSlug)) {
        throw new Error('Please provide a valid SEO URL slug (lowercase letters, numbers, hyphens).');
      }

      const title = input.title.trim().slice(0, SCHEMA_LIMITS.ARTICLE.titleMax);
      const subtitle = input.subtitle.trim().slice(0, SCHEMA_LIMITS.ARTICLE.subtitleMax);
      const content = input.content.trim().slice(0, SCHEMA_LIMITS.ARTICLE.contentMax);
      if (title.length < SCHEMA_LIMITS.ARTICLE.titleMin) {
        throw new Error('Article title must be at least 5 characters.');
      }
      if (subtitle.length < SCHEMA_LIMITS.ARTICLE.subtitleMin) {
        throw new Error('Article subtitle must be at least 10 characters.');
      }
      if (content.length < SCHEMA_LIMITS.ARTICLE.contentMin) {
        throw new Error('Article content must be at least 20 characters.');
      }

      const docId = isExisting && input.id ? input.id : cleanSlug;
      const articlePath = `articles/${docId}`;
      const readingTime = input.readingTime || estimateReadingTime(content);

      const commonFields = {
        slug: cleanSlug,
        title,
        subtitle,
        content,
        featuredImage: (input.featuredImage || '').trim().slice(0, SCHEMA_LIMITS.ARTICLE.featuredImageMax),
        imageCaption: (input.imageCaption || '').trim().slice(0, SCHEMA_LIMITS.ARTICLE.imageCaptionMax),
        categorySlug: slugify(input.categorySlug).slice(0, SCHEMA_LIMITS.ARTICLE.categorySlugMax) || 'make-money-online',
        categoryName: (input.categoryName || 'Make Money Online').trim().slice(0, SCHEMA_LIMITS.ARTICLE.categoryNameMax),
        tags: sanitizeTags(input.tags),
        authorName: (input.authorName || user.displayName || 'Editorial Desk').trim().slice(0, SCHEMA_LIMITS.ARTICLE.authorNameMax),
        authorRole: (input.authorRole || 'Senior Editor').trim().slice(0, SCHEMA_LIMITS.ARTICLE.authorRoleMax),
        authorBio: (input.authorBio || '').trim().slice(0, SCHEMA_LIMITS.ARTICLE.authorBioMax),
        readingTime: Math.max(1, Math.min(60, Number(readingTime) || 5)),
        status: (input.status === 'published' ? 'published' : 'draft') as ArticleStatus,
        isTrending: Boolean(input.isTrending),
        isFeatured: Boolean(input.isFeatured),
        seoTitle: (input.seoTitle || title).trim().slice(0, SCHEMA_LIMITS.ARTICLE.seoTitleMax),
        metaDescription: (input.metaDescription || subtitle).trim().slice(0, SCHEMA_LIMITS.ARTICLE.metaDescriptionMax),
        publishedAt: (input.publishedAt || new Date().toISOString().slice(0, 10)).slice(0, 40),
        updatedAt: serverTimestamp(),
      };

      try {
        const docRef = doc(db, 'articles', docId);
        const snap = isExisting ? await getDoc(docRef) : null;
        if (isExisting && snap?.exists()) {
          await updateDoc(docRef, commonFields);
        } else {
          await setDoc(docRef, {
            ...commonFields,
            authorUid: user.uid,
            views: typeof input.views === 'number' ? Math.max(0, input.views) : 0,
            createdAt: serverTimestamp(),
          });
        }
        return docId;
      } catch (error) {
        handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, articlePath);
      }
    },
    [user, isAdmin]
  );

  const toggleArticleStatus = useCallback(
    async (article: Article) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const nextStatus: ArticleStatus = article.status === 'published' ? 'draft' : 'published';
      const path = `articles/${article.id}`;
      try {
        const docRef = doc(db, 'articles', article.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            status: nextStatus,
            publishedAt: article.publishedAt || new Date().toISOString().slice(0, 10),
            updatedAt: serverTimestamp(),
          });
        } else {
          await saveArticle({ ...article, status: nextStatus }, false);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [user, isAdmin, saveArticle]
  );

  const toggleArticleFlags = useCallback(
    async (article: Article, flags: { isTrending: boolean; isFeatured: boolean }) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const path = `articles/${article.id}`;
      try {
        const docRef = doc(db, 'articles', article.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            isTrending: flags.isTrending,
            isFeatured: flags.isFeatured,
            updatedAt: serverTimestamp(),
          });
        } else {
          await saveArticle({ ...article, ...flags }, false);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [user, isAdmin, saveArticle]
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const path = `articles/${articleId}`;
      try {
        await deleteDoc(doc(db, 'articles', articleId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [user, isAdmin]
  );

  const saveCategory: BlogContextValue['saveCategory'] = useCallback(
    async (input, isExisting) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const cleanSlug = slugify(input.slug || input.name).slice(0, SCHEMA_LIMITS.CATEGORY.slugMax);
      if (cleanSlug.length < 2) throw new Error('Category slug must be at least 2 characters.');
      const docId = isExisting && input.id ? input.id : cleanSlug;
      const path = `categories/${docId}`;
      const payload = {
        slug: cleanSlug,
        name: input.name.trim().slice(0, SCHEMA_LIMITS.CATEGORY.nameMax),
        description: input.description.trim().slice(0, SCHEMA_LIMITS.CATEGORY.descriptionMax),
        order: Math.max(0, Math.min(1000, Number(input.order) || 1)),
        updatedAt: serverTimestamp(),
      };
      try {
        const docRef = doc(db, 'categories', docId);
        const snap = isExisting ? await getDoc(docRef) : null;
        if (isExisting && snap?.exists()) {
          await updateDoc(docRef, payload);
        } else {
          await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
      }
    },
    [user, isAdmin]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
      }
    },
    [user, isAdmin]
  );

  const saveAdvertisement: BlogContextValue['saveAdvertisement'] = useCallback(
    async (input, isExisting) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const docId =
        isExisting && input.id
          ? input.id
          : `ad-${input.slot}-${Date.now().toString(36)}`;
      const path = `advertisements/${docId}`;
      const payload = {
        slot: input.slot,
        label: input.label.trim().slice(0, SCHEMA_LIMITS.AD.labelMax) || 'Advertisement',
        headline: input.headline.trim().slice(0, SCHEMA_LIMITS.AD.headlineMax),
        description: input.description.trim().slice(0, SCHEMA_LIMITS.AD.descriptionMax),
        ctaText: input.ctaText.trim().slice(0, SCHEMA_LIMITS.AD.ctaTextMax) || 'Learn More',
        targetUrl: input.targetUrl.trim().slice(0, SCHEMA_LIMITS.AD.targetUrlMax) || '/',
        sponsorName: input.sponsorName.trim().slice(0, SCHEMA_LIMITS.AD.sponsorNameMax) || 'Partner',
        active: Boolean(input.active),
        updatedAt: serverTimestamp(),
      };
      try {
        const docRef = doc(db, 'advertisements', docId);
        const snap = isExisting ? await getDoc(docRef) : null;
        if (isExisting && snap?.exists()) {
          await updateDoc(docRef, payload);
        } else {
          await setDoc(docRef, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (error) {
        handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
      }
    },
    [user, isAdmin]
  );

  const toggleAdvertisement = useCallback(
    async (ad: Advertisement) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const path = `advertisements/${ad.id}`;
      try {
        const docRef = doc(db, 'advertisements', ad.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            active: !ad.active,
            updatedAt: serverTimestamp(),
          });
        } else {
          await saveAdvertisement({ ...ad, active: !ad.active }, false);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [user, isAdmin, saveAdvertisement]
  );

  const deleteAdvertisement = useCallback(
    async (adId: string) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      try {
        await deleteDoc(doc(db, 'advertisements', adId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `advertisements/${adId}`);
      }
    },
    [user, isAdmin]
  );

  const saveSiteSettings = useCallback(
    async (next: SiteSettings) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const path = 'settings/site';
      const payload = {
        siteName: next.siteName.trim().slice(0, 80),
        tagline: next.tagline.trim().slice(0, 120),
        heroHeadline: next.heroHeadline.trim().slice(0, 160),
        heroSubheadline: next.heroSubheadline.trim().slice(0, 320),
        defaultSeoTitle: next.defaultSeoTitle.trim().slice(0, 120),
        defaultMetaDescription: next.defaultMetaDescription.trim().slice(0, 260),
        contactEmail: next.contactEmail.trim().slice(0, 254),
        newsletterTitle: next.newsletterTitle.trim().slice(0, 120),
        newsletterDescription: next.newsletterDescription.trim().slice(0, 260),
        twitterUrl: next.twitterUrl.trim().slice(0, 300),
        linkedinUrl: next.linkedinUrl.trim().slice(0, 300),
        youtubeUrl: next.youtubeUrl.trim().slice(0, 300),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'settings', 'site'), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    [user, isAdmin]
  );

  const subscribeNewsletter = useCallback(
    async (email: string, region: string, source: string) => {
      const cleanEmail = email.trim().toLowerCase().slice(0, 254);
      if (!SCHEMA_LIMITS.EMAIL_PATTERN.test(cleanEmail)) {
        throw new Error('Please enter a valid email address.');
      }
      const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `subscribers/${subId}`;
      try {
        await setDoc(doc(db, 'subscribers', subId), {
          email: cleanEmail,
          region: (region || 'Global').trim().slice(0, 60),
          source: (source || 'homepage').trim().slice(0, 60),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    []
  );

  const deleteSubscriber = useCallback(
    async (subscriberId: string) => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      try {
        await deleteDoc(doc(db, 'subscribers', subscriberId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `subscribers/${subscriberId}`);
      }
    },
    [user, isAdmin]
  );

  const addAdminUser = useCallback(
    async (uid: string, email: string, name: string, role: 'admin' | 'editor') => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const cleanUid = uid.trim();
      if (!SCHEMA_LIMITS.ID_PATTERN.test(cleanUid)) {
        throw new Error('Admin UID must contain only letters, numbers, hyphens, or underscores.');
      }
      const path = `admins/${cleanUid}`;
      try {
        await setDoc(doc(db, 'admins', cleanUid), {
          email: email.trim().toLowerCase().slice(0, 254),
          name: name.trim().slice(0, 120),
          role,
          addedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [user, isAdmin]
  );

  const removeAdminUser = useCallback(
    async (uid: string) => {
      if (!user || !isOwnerAdmin) throw new Error('Primary owner authorization required.');
      try {
        await deleteDoc(doc(db, 'admins', uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${uid}`);
      }
    },
    [user, isOwnerAdmin]
  );

  const uploadFeaturedImage = useCallback(
    async (file: File): Promise<string> => {
      if (!user || !isAdmin) throw new Error('Administrator authentication required.');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'article-image';
      const storageRef = ref(storage, `articles/${Date.now()}-${safeName}.${ext}`);
      await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
      return getDownloadURL(storageRef);
    },
    [user, isAdmin]
  );

  const getAdBySlot = useCallback(
    (slot: Advertisement['slot']) => activeAds.find((ad) => ad.slot === slot),
    [activeAds]
  );

  const value = useMemo<BlogContextValue>(
    () => ({
      user,
      authReady,
      isAdmin,
      isOwnerAdmin,
      loading,
      usingSeedFallback,
      articles,
      publishedArticles,
      categories,
      advertisements,
      activeAds,
      settings,
      subscribers,
      admins,
      signInWithGoogle,
      logout,
      seedDatabase,
      saveArticle,
      toggleArticleStatus,
      toggleArticleFlags,
      deleteArticle,
      saveCategory,
      deleteCategory,
      saveAdvertisement,
      toggleAdvertisement,
      deleteAdvertisement,
      saveSiteSettings,
      subscribeNewsletter,
      deleteSubscriber,
      addAdminUser,
      removeAdminUser,
      uploadFeaturedImage,
      getAdBySlot,
    }),
    [
      user,
      authReady,
      isAdmin,
      isOwnerAdmin,
      loading,
      usingSeedFallback,
      articles,
      publishedArticles,
      categories,
      advertisements,
      activeAds,
      settings,
      subscribers,
      admins,
      signInWithGoogle,
      logout,
      seedDatabase,
      saveArticle,
      toggleArticleStatus,
      toggleArticleFlags,
      deleteArticle,
      saveCategory,
      deleteCategory,
      saveAdvertisement,
      toggleAdvertisement,
      deleteAdvertisement,
      saveSiteSettings,
      subscribeNewsletter,
      deleteSubscriber,
      addAdminUser,
      removeAdminUser,
      uploadFeaturedImage,
      getAdBySlot,
    ]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}

export function useBlog() {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error('useBlog must be used within a BlogProvider');
  return ctx;
}
