import type { Advertisement, Category, SiteSettings } from '../types/blog';

export const EDITORIAL_IMAGES = {
  hero: '/src/assets/images/hero_editorial_workspace_1795074986185.jpg',
  aiTools: '/src/assets/images/ai_tools_editorial_1795074979664.jpg',
  freelancing: '/src/assets/images/freelancing_global_work_1795074938145.jpg',
  passiveIncome: '/src/assets/images/passive_income_assets_1795074932271.jpg',
  affiliateSeo: '/src/assets/images/affiliate_seo_growth_1795074933700.jpg',
  workFromHome: '/src/assets/images/work_from_home_studio_1795074932580.jpg',
} as const;

export const EDITORIAL_GALLERY = [
  { label: 'Executive Workspace (Hero)', url: EDITORIAL_IMAGES.hero },
  { label: 'AI Builder Desk', url: EDITORIAL_IMAGES.aiTools },
  { label: 'Global Freelance Studio', url: EDITORIAL_IMAGES.freelancing },
  { label: 'Passive Assets & Finance', url: EDITORIAL_IMAGES.passiveIncome },
  { label: 'Publishing & SEO Newsroom', url: EDITORIAL_IMAGES.affiliateSeo },
  { label: 'Work From Home Studio', url: EDITORIAL_IMAGES.workFromHome },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'EarnSmart Daily',
  tagline: 'Learn. Earn. Grow.',
  heroHeadline: 'Discover Smarter Ways to Make Money Online',
  heroSubheadline:
    'Independent editorial playbooks on AI workflows, high-ticket freelancing, passive digital assets, and remote careers for readers across the US, UK, Canada, Australia, India, and worldwide.',
  defaultSeoTitle: 'EarnSmart Daily – Learn. Earn. Grow. | Global Online Earning Guides',
  defaultMetaDescription:
    'Discover smarter ways to make money online with practical editorial guides on AI tools, freelancing, passive income, affiliate marketing, and remote work.',
  contactEmail: 'editorial@earnsmartdaily.com',
  newsletterTitle: 'The Weekly EarnSmart Dispatch',
  newsletterDescription:
    'Receive original online income breakdowns, verified remote opportunities, and practical AI playbooks every Sunday morning.',
  twitterUrl: 'https://x.com/earnsmartdaily',
  linkedinUrl: 'https://linkedin.com/company/earnsmartdaily',
  youtubeUrl: 'https://youtube.com/@earnsmartdaily',
};

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'make-money-online',
    slug: 'make-money-online',
    name: 'Make Money Online',
    description:
      'Data-backed blueprints, cross-border payment strategies, and sustainable frameworks for earning online from anywhere.',
    order: 1,
  },
  {
    id: 'ai-tools',
    slug: 'ai-tools',
    name: 'AI Tools',
    description:
      'Practical reviews, automation workflows, and monetization models powered by modern artificial intelligence.',
    order: 2,
  },
  {
    id: 'freelancing',
    slug: 'freelancing',
    name: 'Freelancing',
    description:
      'Client acquisition, global rate negotiation, retainers, and positioning for independent consultants and specialists.',
    order: 3,
  },
  {
    id: 'affiliate-marketing',
    slug: 'affiliate-marketing',
    name: 'Affiliate Marketing',
    description:
      'High-intent comparison hubs, B2B SaaS recurring commissions, and ethical conversion strategies that compound.',
    order: 4,
  },
  {
    id: 'passive-income',
    slug: 'passive-income',
    name: 'Passive Income',
    description:
      'Evergreen digital assets, licensing models, dividend portfolios, and automated revenue streams built for longevity.',
    order: 5,
  },
  {
    id: 'blogging-seo',
    slug: 'blogging-seo',
    name: 'Blogging & SEO',
    description:
      'Editorial authority, search intent architecture, topical maps, and display-ad monetization for independent publishers.',
    order: 6,
  },
  {
    id: 'side-hustles',
    slug: 'side-hustles',
    name: 'Side Hustles',
    description:
      'Low-overhead weekend ventures and skill-based income tracks that fit cleanly alongside a full-time career.',
    order: 7,
  },
  {
    id: 'work-from-home',
    slug: 'work-from-home',
    name: 'Work From Home',
    description:
      'Verified asynchronous remote roles, global employer directories, and home-office systems for distributed professionals.',
    order: 8,
  },
  {
    id: 'digital-products',
    slug: 'digital-products',
    name: 'Digital Products',
    description:
      'Design, pricing, and launch playbooks for templates, micro-SaaS utilities, cohort workshops, and paid newsletters.',
    order: 9,
  },
  {
    id: 'online-business',
    slug: 'online-business',
    name: 'Online Business',
    description:
      'Unit economics, bootstrapping discipline, global entity setup, and scaling solo digital ventures into durable companies.',
    order: 10,
  },
];

export const SEED_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-header-leaderboard',
    slot: 'header-leaderboard',
    label: 'Partner Spotlight',
    headline: 'Sponsor Placement Available — Header Leaderboard',
    description:
      'Customize or pause this advertisement banner anytime from the Advertisements tab in your Admin Dashboard.',
    ctaText: 'Manage Ads',
    targetUrl: '/admin',
    sponsorName: 'EarnSmart Media',
    active: false,
  },
];
