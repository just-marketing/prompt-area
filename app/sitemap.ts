import type { MetadataRoute } from 'next'
import { COMPARISONS } from './vs/comparisons'
import { POSTS } from './blog/posts'
import { docsPageOrder } from '@/lib/docs-navigation'

const SITE_URL = 'https://prompt-area.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/styles`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${SITE_URL}/for-ai-apps`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const comparisonPages: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${SITE_URL}/vs/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const blogPages: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Skip /docs itself (already in staticPages) to avoid a duplicate entry.
  const docsPages: MetadataRoute.Sitemap = docsPageOrder
    .filter((item) => item.href !== '/docs')
    .map((item) => ({
      url: `${SITE_URL}${item.href}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  return [...staticPages, ...comparisonPages, ...blogPages, ...docsPages]
}
