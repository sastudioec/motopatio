type ListingLike = {
  id: string
  slug: string | null
  marca: string
  modelo: string
  anio: number
}

export function buildItemList(listings: ListingLike[], base: string) {
  return {
    '@type': 'ItemList',
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/motos/${l.slug || l.id}`,
      name: `${l.marca} ${l.modelo} ${l.anio}`,
    })),
  }
}

export type BreadcrumbItemJsonLd = { name: string; item: string }

export function buildBreadcrumbList(items: BreadcrumbItemJsonLd[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  }
}

export function buildCollectionPage({ url, name, description, listings, base }: {
  url: string
  name: string
  description: string
  listings: ListingLike[]
  base: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: buildItemList(listings, base),
  }
}
