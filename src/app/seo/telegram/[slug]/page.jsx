import Link from 'next/link';
import { notFound } from 'next/navigation';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import {
  getSeoPageBySlug,
  getSeoPageCatalog,
  normalizeForSeoMatch,
  SITE_URL,
} from '@/lib/seoLandingPages';
import classes from '@/app/styles/SeoLanding.module.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COUNTRY_FLAGS = {
  mx: '🇲🇽', us: '🇺🇸', ar: '🇦🇷', co: '🇨🇴', es: '🇪🇸', pe: '🇵🇪',
  cl: '🇨🇱', ve: '🇻🇪', br: '🇧🇷', ec: '🇪🇨', gt: '🇬🇹', bo: '🇧🇴',
  do: '🇩🇴', hn: '🇭🇳', py: '🇵🇾', sv: '🇸🇻', ni: '🇳🇮', cr: '🇨🇷',
  pa: '🇵🇦', uy: '🇺🇾', pr: '🇵🇷', ca: '🇨🇦', de: '🇩🇪', fr: '🇫🇷',
  it: '🇮🇹', gb: '🇬🇧', nl: '🇳🇱', pt: '🇵🇹', jp: '🇯🇵', kr: '🇰🇷',
  cn: '🇨🇳', in: '🇮🇳', ru: '🇷🇺', au: '🇦🇺',
};

const UNSAFE_GROUP_TERMS = ["18", "adulto", "adultos", "casero", "caseros", "desnuda", "desnudas", "hacking", "hot", "nsfw", "pack", "packs", "pelicula", "peliculas", "porno", "tributo", "tributos", "xxx"];
const GENERIC_QUERY_TERMS = [
  'telegram', 'grupo', 'grupos', 'comunidad', 'comunidades', 'de', 'del', 'en',
  'activos', 'actualizados', 'gratis', 'verificados', 'latam', 'mexico', 'espana',
  'argentina', 'colombia', 'peru', 'chile', 'estados', 'unidos', '2026',
];

const asText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  if (typeof value === 'object') return value.es || value.en || Object.values(value).filter(Boolean)[0] || '';
  return String(value);
};

const isUnsafeGroup = (group) => {
  const content18 = normalizeForSeoMatch(group.content18);
  const text = groupText(group);
  return ["si", "sí", "yes", "true"].includes(content18) || UNSAFE_GROUP_TERMS.some((term) => text.includes(term));
};

const groupText = (group) => normalizeForSeoMatch([
  group.name,
  asText(group.description),
  asText(group.tag),
  ...(Array.isArray(group.categories) ? group.categories : []),
].join(' '));

const getQueryTokens = (page) => normalizeForSeoMatch(page.query)
  .split(/[^a-z0-9]+/)
  .filter((term) => term && !GENERIC_QUERY_TERMS.includes(term));

const matchesTopic = (group, topic) => {
  if (!topic) return true;
  const categories = Array.isArray(group.categories) ? group.categories : [];
  const normalizedCategories = categories.map((category) => slugify(category));
  const aliases = topic.aliases.map((alias) => normalizeForSeoMatch(alias));
  const text = groupText(group);

  return normalizedCategories.includes(topic.slug) || aliases.some((alias) => text.includes(alias));
};

const matchesLocation = (group, location) => location.code === 'global' || normalizeForSeoMatch(group.city) === location.code;

const matchesQuery = (group, page) => {
  const tokens = getQueryTokens(page);
  if (!tokens.length) return true;
  const text = groupText(group);
  return tokens.some((token) => text.includes(token));
};

async function getTelegramGroupsForPage(page) {
  const snap = await getDocs(query(
    collection(db, 'groups'),
    where('tipo', '==', 'telegram'),
    limit(800)
  ));

  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((group) => !isUnsafeGroup(group))
    .filter((group) => matchesLocation(group, page.location))
    .filter((group) => matchesTopic(group, page.topic))
    .filter((group) => matchesQuery(group, page))
    .sort((a, b) => {
      const featuredDiff = Number(Boolean(b.destacado)) - Number(Boolean(a.destacado));
      if (featuredDiff) return featuredDiff;
      return (b.visitas || 0) - (a.visitas || 0);
    })
    .slice(0, 18);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);

  if (!page) {
    return {
      title: 'Landing no encontrada | JoinGroups',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.canonical },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.canonical,
      siteName: 'JoinGroups',
      type: 'website',
      images: [`${SITE_URL}/JoinGroup.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [`${SITE_URL}/JoinGroup.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function TelegramSeoLanding({ params }) {
  const { slug } = await params;
  const page = getSeoPageBySlug(slug);

  if (!page) notFound();

  const groups = await getTelegramGroupsForPage(page);
  if (!groups.length) notFound();

  const relatedPages = getSeoPageCatalog()
    .filter((item) => item.slug !== page.slug && item.location.code === page.location.code)
    .slice(0, 8);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.h1,
    itemListElement: groups.slice(0, 10).map((group, index) => {
      const mainCategory = group.categories?.[0] || 'otros';
      const groupSlug = group.slug || slugify(group.name);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/comunidades/grupos-de-telegram/${slugify(mainCategory)}/${groupSlug}`,
        name: group.name,
      };
    }),
  };

  return (
    <main className={classes.pageBg}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className={classes.wrapper}>
        <nav className={classes.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href="/comunidades/grupos-de-telegram">Grupos de Telegram</Link>
          <span>/</span>
          <span>{page.label}</span>
        </nav>

        <section className={classes.hero}>
          <div className={classes.eyebrow}>
            <span className={classes.eyebrowDot} />
            Landing generada desde consultas reales
          </div>
          <h1 className={classes.title}>{page.h1}</h1>
          <p className={classes.description}>{page.description}</p>
          <div className={classes.heroMeta}>
            <span className={classes.metaPill}>{groups.length} grupos encontrados</span>
            <span className={classes.metaPill}>{page.year}</span>
            <span className={classes.metaPill}>{page.location.label}</span>
            <span className={classes.metaPill}>Telegram</span>
          </div>
        </section>

        <div className={classes.grid}>
          <section className={classes.section}>
            <div className={classes.sectionHeader}>
              <h2 className={classes.sectionTitle}>Grupos recomendados</h2>
              <span className={classes.sectionCount}>Actualizado automaticamente</span>
            </div>

            <div className={classes.cardList}>
              {groups.map((group) => {
                const mainCategory = group.categories?.[0] || 'otros';
                const groupSlug = group.slug || slugify(group.name);
                const desc = asText(group.description);
                const href = `/comunidades/grupos-de-telegram/${slugify(mainCategory)}/${groupSlug}`;

                return (
                  <Link key={group.id} href={href} className={classes.groupCard}>
                    <div className={classes.groupTop}>
                      <div className={classes.avatar}>
                        <img src="/telegramicons.png" alt="Telegram" />
                      </div>
                      <div className={classes.groupInfo}>
                        <div className={classes.groupName}>{group.name}</div>
                        <div className={classes.groupMeta}>
                          {COUNTRY_FLAGS[group.city] ? `${COUNTRY_FLAGS[group.city]} ` : ''}
                          {page.location.code === 'global' ? 'Comunidad global' : page.location.label}
                        </div>
                      </div>
                    </div>

                    {desc && <p className={classes.groupDesc}>{desc}</p>}

                    <div className={classes.groupFooter}>
                      <span className={classes.category}>{mainCategory}</span>
                      <span className={classes.views}>{group.visitas || 0} vistas</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <aside className={classes.aside}>
            <h2 className={classes.asideTitle}>Sobre esta seleccion</h2>
            <p className={classes.asideText}>
              Esta pagina combina consultas reales de Search Console con datos actuales de Firestore. Solo se muestran grupos de Telegram disponibles en JoinGroups y se omiten landings sin resultados.
            </p>

            <h2 className={classes.asideTitle}>Explorar mas</h2>
            <div className={classes.topicList}>
              {relatedPages.map((item) => (
                <Link key={item.slug} href={"/seo/telegram/" + item.slug} className={classes.topicPill}>
                  {item.topic?.label || item.label}
                </Link>
              ))}
            </div>

            <Link href="/comunidades/subir-grupo" className={classes.cta}>
              Publicar mi grupo gratis
            </Link>

            <div className={classes.faq}>
              <div className={classes.faqItem}>
                <h3>Como se eligen los grupos?</h3>
                <p>Se priorizan grupos destacados, con actividad y categorias relacionadas con la consulta de esta pagina.</p>
              </div>
              <div className={classes.faqItem}>
                <h3>La pagina se actualiza?</h3>
                <p>Si. La landing consulta Firestore en servidor, por lo que nuevos grupos pueden aparecer sin crear archivos manuales.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
