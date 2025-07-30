// src/app/blog/[slug]/page.jsx
import { notFound } from 'next/navigation';
import { blogs } from '@/app/data/blogs';
import ClientBlogPost from './ClientBlogPost';

export async function generateStaticParams() {
  return blogs.map((post) => ({ slug: post.slug }));
}

// Aquí debes recibir params como argumento asíncrono y esperar a que se resuelva
export async function generateMetadata({ params }) {
  const resolvedParams = await params; // <--- espera a params
  const { slug } = resolvedParams;

  const post = blogs.find((p) => p.slug === slug);
  if (!post) return { title: 'Blog no encontrado', description: 'Este artículo no existe.' };

  return {
    title: post.title,
    description: post.description || post.title,
    openGraph: {
      title: post.title,
      description: post.description || post.title,
      url: `https://joingroups.pro/blog/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.title,
    },
  };
}

export default async function BlogPost({ params }) {
  const resolvedParams = await params; // <--- espera a params
  const { slug } = resolvedParams;

  const post = blogs.find((p) => p.slug === slug);
  if (!post) return notFound();

  return <ClientBlogPost post={post} />;
}
