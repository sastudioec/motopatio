import Banner from '@/app/components/Banner'
import MotosClient from './MotosClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MotosPage() {
  return (
    <MotosClient
      bannerTop={<Banner position="motos_hero" aspectRatio="4/1" />}
      bannerMidLeft={<Banner position="motos_mid_left" aspectRatio="4/1" />}
      bannerMidRight={<Banner position="motos_mid_right" aspectRatio="4/1" />}
    />
  )
}
