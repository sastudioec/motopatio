import Link from 'next/link'
import Image from 'next/image'
import { formatFechaLarga } from '@/lib/format-date'
import type { PostMeta } from '@/lib/blog'

export default function BlogCard({ post }: { post: PostMeta }) {
  const href = `/blog/${post.slug}`
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: '#fff',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1.5px solid #e8e8e8',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#e8e8e8',
          }}
        >
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 600px) 100vw, 360px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
              }}
            >
              📰
            </div>
          )}
        </div>
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
          }}
        >
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#E8390E',
                    background: '#fff5f0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#1E2340',
              fontFamily: 'Poppins,sans-serif',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p
              style={{
                fontSize: '13px',
                color: '#52525b',
                lineHeight: 1.5,
                margin: 0,
                flex: 1,
              }}
            >
              {post.excerpt}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '11px',
              color: '#888',
              marginTop: '4px',
            }}
          >
            <span>{formatFechaLarga(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
