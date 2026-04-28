// Blog helpers. Lee posts MDX desde content/blog/ y los expone con
// frontmatter parseado. Esta capa NO renderiza MDX — solo lee y lista.
// El render con next-mdx-remote/rsc se hace en app/blog/[slug]/page.tsx.

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export type PostMeta = {
  slug: string
  title: string
  excerpt: string
  coverImage: string
  publishedAt: string
  author: string
  tags: string[]
  readingTime: string
}

export type Post = PostMeta & { content: string }

async function listFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(BLOG_DIR)
    return files.filter((f) => f.endsWith('.mdx'))
  } catch {
    return []
  }
}

function parsePost(slug: string, raw: string): Post {
  const parsed = matter(raw)
  const data = parsed.data as Partial<PostMeta>
  const rt = data.readingTime || readingTime(parsed.content).text
  return {
    slug: data.slug || slug,
    title: data.title || slug,
    excerpt: data.excerpt || '',
    coverImage: data.coverImage || '',
    publishedAt: data.publishedAt || '',
    author: data.author || 'MotoPatío',
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingTime: rt,
    content: parsed.content,
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await listFiles()
  const posts: PostMeta[] = []
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, '')
    const raw = await fs.readFile(path.join(BLOG_DIR, f), 'utf8')
    const { content: _content, ...meta } = parsePost(slug, raw)
    posts.push(meta)
  }
  return posts.sort((a, b) =>
    (b.publishedAt || '').localeCompare(a.publishedAt || '')
  )
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.mdx`), 'utf8')
    return parsePost(slug, raw)
  } catch {
    return null
  }
}

export async function getRelatedPosts(
  slug: string,
  tags: string[],
  limit = 3
): Promise<PostMeta[]> {
  const all = await getAllPosts()
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: p.tags.filter((t) => tags.includes(t)).length }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.p.publishedAt || '').localeCompare(a.p.publishedAt || '')
    )
    .slice(0, limit)
    .map(({ p }) => p)
}
