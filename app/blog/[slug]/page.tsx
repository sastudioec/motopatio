import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  type PostMeta,
} from '@/lib/blog'
import { formatFechaLarga } from '@/lib/format-date'
import BlogCard from '../BlogCard'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(
  /\/$/,
  ''
)

export const revalidate = 300

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post no encontrado' }
  const url = `${BASE}/blog/${post.slug}`
  const ogImage = post.coverImage
    ? new URL(post.coverImage, BASE).toString()
    : `${BASE}/og-default.jpg`
  return {
    title: { absolute: `${post.title} | MotoPatío` },
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'es_EC',
      siteName: 'MotoPatío',
      url,
      title: `${post.title} | MotoPatío`,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | MotoPatío`,
      description: post.excerpt,
      images: [ogImage],
    },
  }
}

function isExternalUrl(href: string | undefined): boolean {
  if (!href) return false
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false
  if (!/^https?:\/\//i.test(href)) return false
  try {
    const u = new URL(href)
    return (
      u.hostname !== 'motopatio.com' && u.hostname !== 'www.motopatio.com'
    )
  } catch {
    return false
  }
}

const mdxComponents = {
  h2: ({ children, ...rest }: React.ComponentProps<'h2'>) => (
    <h2
      style={{
        fontFamily: 'Poppins,sans-serif',
        fontSize: '26px',
        fontWeight: 800,
        color: '#1E2340',
        marginTop: '56px',
        marginBottom: '16px',
        paddingTop: '22px',
        position: 'relative',
        lineHeight: 1.3,
      }}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '56px',
          height: '4px',
          background: '#E8390E',
          borderRadius: '2px',
        }}
      />
      {children}
    </h2>
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3
      style={{
        fontFamily: 'Poppins,sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: '#1E2340',
        marginTop: '28px',
        marginBottom: '10px',
        lineHeight: 1.3,
      }}
      {...props}
    />
  ),
  h4: (props: React.ComponentProps<'h4'>) => (
    <h4
      style={{
        fontSize: '17px',
        fontWeight: 700,
        color: '#1E2340',
        marginTop: '20px',
        marginBottom: '8px',
      }}
      {...props}
    />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p
      style={{
        fontSize: '16px',
        lineHeight: 1.75,
        color: '#1E2340',
        margin: '0 0 16px',
      }}
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul
      style={{
        fontSize: '16px',
        lineHeight: 1.75,
        color: '#1E2340',
        paddingLeft: '22px',
        margin: '0 0 16px',
      }}
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol
      style={{
        fontSize: '16px',
        lineHeight: 1.75,
        color: '#1E2340',
        paddingLeft: '22px',
        margin: '0 0 16px',
      }}
      {...props}
    />
  ),
  li: (props: React.ComponentProps<'li'>) => (
    <li style={{ marginBottom: '6px' }} {...props} />
  ),
  a: ({ href, children, ...rest }: React.ComponentProps<'a'>) => {
    const external = isExternalUrl(href)
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#E8390E', textDecoration: 'underline' }}
          {...rest}
        >
          {children}
        </a>
      )
    }
    if (href && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))) {
      return (
        <a
          href={href}
          style={{ color: '#E8390E', textDecoration: 'underline' }}
          {...rest}
        >
          {children}
        </a>
      )
    }
    return (
      <Link
        href={href || '#'}
        style={{ color: '#E8390E', textDecoration: 'underline' }}
      >
        {children}
      </Link>
    )
  },
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote
      style={{
        borderLeft: '4px solid #E8390E',
        background: '#fff5f0',
        padding: '14px 18px',
        margin: '20px 0',
        fontSize: '15px',
        color: '#1E2340',
        lineHeight: 1.65,
        borderRadius: '0 6px 6px 0',
      }}
      {...props}
    />
  ),
  code: (props: React.ComponentProps<'code'>) => (
    <code
      style={{
        background: '#f4f4f4',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#1E2340',
      }}
      {...props}
    />
  ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre
      style={{
        background: '#1E2340',
        color: '#f4f4f4',
        padding: '16px',
        borderRadius: '6px',
        overflowX: 'auto',
        fontSize: '13px',
        lineHeight: 1.55,
        margin: '20px 0',
      }}
      {...props}
    />
  ),
  table: (props: React.ComponentProps<'table'>) => (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          background: '#fff',
          border: '1px solid #e8e8e8',
        }}
        {...props}
      />
    </div>
  ),
  thead: (props: React.ComponentProps<'thead'>) => (
    <thead style={{ background: '#fafafa' }} {...props} />
  ),
  th: (props: React.ComponentProps<'th'>) => (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        fontWeight: 700,
        color: '#1E2340',
        fontSize: '13px',
        borderBottom: '1px solid #e8e8e8',
      }}
      {...props}
    />
  ),
  td: (props: React.ComponentProps<'td'>) => (
    <td
      style={{
        padding: '10px 12px',
        color: '#1E2340',
        borderBottom: '1px solid #f0f0f0',
        verticalAlign: 'top',
      }}
      {...props}
    />
  ),
  hr: (props: React.ComponentProps<'hr'>) => (
    <hr
      style={{ border: 0, borderTop: '1px solid #e8e8e8', margin: '32px 0' }}
      {...props}
    />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong style={{ color: '#1E2340', fontWeight: 700 }} {...props} />
  ),
  img: (props: React.ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', margin: '20px 0' }}
      alt={props.alt || ''}
      {...props}
    />
  ),
}

function buildArticleJsonLd(post: PostMeta & { contentLength?: number }) {
  const url = `${BASE}/blog/${post.slug}`
  const image = post.coverImage
    ? new URL(post.coverImage, BASE).toString()
    : `${BASE}/og-default.jpg`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: BASE,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MotoPatío',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE}/motopatio-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: post.tags.join(', '),
  }
}

function buildBreadcrumbJsonLd(post: PostMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${BASE}/blog/${post.slug}`,
      },
    ],
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.slug, post.tags, 3)

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArticleJsonLd(post)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbJsonLd(post)),
        }}
      />

      {post.coverImage && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '21 / 9',
            maxHeight: '420px',
            background: '#1E2340',
            overflow: 'hidden',
          }}
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      <article
        style={{
          maxWidth: '780px',
          margin: '0 auto',
          padding: '32px 20px 48px',
        }}
      >
        <nav
          aria-label="Migas de pan"
          style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}
        >
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
            Inicio
          </Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <Link
            href="/blog"
            style={{ color: '#666', textDecoration: 'none' }}
          >
            Blog
          </Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#1E2340', fontWeight: 700 }}>
            {post.title}
          </span>
        </nav>

        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#E8390E',
                  background: '#fff5f0',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1
          style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: '34px',
            fontWeight: 900,
            color: '#1E2340',
            lineHeight: 1.2,
            margin: '0 0 16px',
          }}
        >
          {post.title}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '13px',
            color: '#666',
            marginBottom: '32px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, color: '#1E2340' }}>
            {post.author}
          </span>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {formatFechaLarga(post.publishedAt)}
          </time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <div className="blog-content">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{
              mdxOptions: { remarkPlugins: [remarkGfm] },
            }}
          />
        </div>

        <div
          style={{
            marginTop: '48px',
            padding: '28px',
            background: '#1E2340',
            borderRadius: '8px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 8px',
              color: '#fff',
            }}
          >
            ¿Listo para tu próxima moto?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#bdbed1',
              margin: '0 0 18px',
              lineHeight: 1.6,
            }}
          >
            Encuentra motos publicadas por particulares y concesionarios en todo
            Ecuador, o publica la tuya gratis.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/motos"
              style={{
                background: '#E8390E',
                color: '#fff',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: 800,
                borderRadius: '4px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Ver motos en venta
            </Link>
            <Link
              href="/publicar"
              style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid #fff',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 800,
                borderRadius: '4px',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Publicar mi moto
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section
          style={{
            background: '#fff',
            borderTop: '1px solid #e8e8e8',
            padding: '40px 20px',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'Poppins,sans-serif',
                fontSize: '20px',
                fontWeight: 800,
                color: '#1E2340',
                margin: '0 0 18px',
              }}
            >
              Más del blog
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
