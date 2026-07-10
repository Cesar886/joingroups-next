// src/app/blog/[slug]/page.jsx
import { notFound } from 'next/navigation';
import { blogs } from '@/app/data/blogs';
import ClientBlogPost from './ClientBlogPost';

const SITE_URL = 'https://www.joingroups.lat';

export async function generateStaticParams() {
  return blogs.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const post = blogs.find((p) => p.slug === slug);
  if (!post) return { title: 'Blog no encontrado', description: 'Este artículo no existe.' };

  return {
    title: post.title,
    description: post.description || post.title,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description || post.title,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      images: [
        {
          url: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/JoinGroups.webp`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.title,
      images: [post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/JoinGroups.webp`],
    },
  };
}

function buildArticleJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    image: post.image
      ? `${SITE_URL}${post.image}`
      : `${SITE_URL}/JoinGroups.webp`,
    publisher: {
      '@type': 'Organization',
      name: 'JoinGroups',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/JoinGroups.webp`,
      },
    },
    author: {
      '@type': 'Organization',
      name: 'JoinGroups',
      url: SITE_URL,
    },
    datePublished: post.datePublished || '2026-01-01',
    dateModified: post.dateModified || '2026-06-30',
  };
}

export default async function BlogPost({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const post = blogs.find((p) => p.slug === slug);
  if (!post) return notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(post)) }}
      />
      <ClientBlogPost post={post} />
    </>
  );
}
