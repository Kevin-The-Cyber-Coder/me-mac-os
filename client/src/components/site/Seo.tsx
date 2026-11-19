import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useSite } from '../../store/site'

const SITE_URL = 'https://kevinthecybercoder.dev'

export function Seo({
  title,
  description,
  image,
  type = 'website',
  noIndex,
}: {
  title?: string
  description?: string
  image?: string
  type?: string
  noIndex?: boolean
}) {
  const { settings, profile } = useSite()
  const location = useLocation()

  const fullTitle = title
    ? `${title} — ${profile?.displayName || 'Kevin The Cyber Coder'}`
    : settings?.general?.title || 'Kevin The Cyber Coder — Full-Stack Developer & Technology Innovator'
  const desc =
    description ||
    settings?.general?.description ||
    profile?.shortBio ||
    'Interactive macOS-inspired portfolio of Mukeshimana Kevin — full-stack developer and technology innovator.'
  const ogImage = image || settings?.seo?.ogImage || `${SITE_URL}/avatar.svg`
  const canonical = settings?.seo?.canonical || SITE_URL

  useEffect(() => {
    document.title = fullTitle
  }, [fullTitle])

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={`${canonical}${location.pathname}`} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={`${canonical}${location.pathname}`} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
