import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import BlogCard from './BlogCard'

export const revalidate = 300

export default async function BlogIndexPage() {
  const posts = await getAllPosts()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '32px 20px 16px',
        }}
      >
        <nav
          aria-label="Migas de pan"
          style={{ fontSize: '12px', color: '#666', marginBottom: '14px' }}
        >
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
            Inicio
          </Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#1E2340', fontWeight: 700 }}>Blog</span>
        </nav>
        <h1
          style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: '32px',
            fontWeight: 900,
            color: '#1E2340',
            margin: '0 0 8px',
          }}
        >
          Blog MotoPatío
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#52525b',
            maxWidth: '640px',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Guías, trámites y consejos para comprar, vender y mantener tu moto en
          Ecuador.
        </p>
      </div>

      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '16px 20px 48px',
        }}
      >
        {posts.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '56px 24px',
              textAlign: 'center',
              border: '1px solid #e8e8e8',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📰</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#1E2340',
                marginBottom: '6px',
              }}
            >
              Aún no hay posts publicados
            </div>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
              Pronto publicaremos guías y consejos.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
