import slugify from './slugify';

export const SITE_URL = 'https://www.joingroups.lat';

const CURRENT_YEAR = 2026;
const YEARS = [String(CURRENT_YEAR)];

const SAFE_SEARCH_CONSOLE_QUERIES = [
  'telegram grupos',
  'comunidades telegram',
  'grupos telegram activos',
  'grupos telegram actualizados',
  'grupos telegram gratis',
  'grupos telegram verificados',
];

const REJECTED_SEARCH_CONSOLE_QUERIES = [
  'tributos telegram',
  'grupos telegram caseros espana',
  'packs telegram',
  'telegram desnudas',
  'peliculas telegram grupos',
  'mejores grupos porno telegram',
  'grupos xxx telegram',
  'caseros telegram',
  'grupos telegram links porno',
  'gupos xxx telegram',
];

const BLOCKED_QUERY_TERMS = [
  '18',
  'adulto',
  'adultos',
  'casero',
  'caseros',
  'desnuda',
  'desnudas',
  'hacking',
  'nsfw',
  'pack',
  'packs',
  'pelicula',
  'peliculas',
  'porno',
  'sin censura',
  'tributo',
  'tributos',
  'xxx',
];

const LOCATIONS = [
  { code: 'global', label: 'Latam', phrase: 'en comunidades hispanas' },
  { code: 'mx', label: 'Mexico', phrase: 'en Mexico' },
  { code: 'es', label: 'Espana', phrase: 'en Espana' },
  { code: 'ar', label: 'Argentina', phrase: 'en Argentina' },
  { code: 'co', label: 'Colombia', phrase: 'en Colombia' },
  { code: 'pe', label: 'Peru', phrase: 'en Peru' },
  { code: 'cl', label: 'Chile', phrase: 'en Chile' },
  { code: 'us', label: 'Estados Unidos', phrase: 'en Estados Unidos' },
];

const SAFE_TOPICS = [
  { slug: 'anime-y-manga', label: 'Anime y manga', aliases: ['anime', 'anime y manga', 'manga'] },
  { slug: 'gaming', label: 'Gaming', aliases: ['gaming', 'videojuegos', 'juegos'] },
  { slug: 'tecnologia', label: 'Tecnologia', aliases: ['tecnologia', 'tech'] },
  { slug: 'programacion', label: 'Programacion', aliases: ['programacion', 'codigo', 'desarrollo'] },
  { slug: 'musica', label: 'Musica', aliases: ['musica'] },
  { slug: 'futbol', label: 'Futbol', aliases: ['futbol', 'deportes'] },
  { slug: 'amistad', label: 'Amistad', aliases: ['amistad', 'social'] },
  { slug: 'cursos-y-tutoriales', label: 'Cursos y tutoriales', aliases: ['cursos', 'tutoriales', 'estudio'] },
  { slug: 'criptomonedas', label: 'Criptomonedas', aliases: ['criptomonedas', 'crypto', 'bitcoin'] },
  { slug: 'memes-y-humor', label: 'Memes y humor', aliases: ['memes', 'humor'] },
];

const cleanText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const capitalizeWords = (value) => String(value || '')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

export function isAllowedSeoQuery(query) {
  const normalized = cleanText(query);
  return !BLOCKED_QUERY_TERMS.some((term) => normalized.includes(term));
}

const buildDescription = ({ label, location, year }) => {
  const locationText = location.code === 'global' ? 'comunidades hispanas' : location.label;
  return `Encuentra ${label} actualizados para ${locationText} en ${year}. Directorio con grupos reales de Telegram, categorias claras y enlaces revisados por JoinGroups.`;
};

const makeDefinition = ({ query, label, location, year, topic = null, source }) => {
  const slugParts = [query, location.code !== 'global' ? location.label : null, year].filter(Boolean);
  const slug = slugify(slugParts.join(' '));
  const locationTitle = location.code === 'global' ? '' : ` ${location.label}`;

  return {
    slug,
    query,
    label,
    source,
    year,
    location,
    topic,
    title: `${capitalizeWords(label)}${locationTitle} ${year}`,
    h1: `${capitalizeWords(label)} ${location.phrase} (${year})`,
    description: buildDescription({ label, location, year }),
    canonical: SITE_URL + "/seo/telegram/" + slug,
  };
};

export function getRejectedSearchConsoleQueries() {
  return REJECTED_SEARCH_CONSOLE_QUERIES.map((query) => ({
    query,
    reason: 'Excluida por politica interna: adulto, posible contenido no consentido, pirateria o doorway spam.',
  }));
}

export function getSeoPageCatalog() {
  const pages = new Map();

  for (const year of YEARS) {
    for (const location of LOCATIONS) {
      for (const query of SAFE_SEARCH_CONSOLE_QUERIES) {
        if (!isAllowedSeoQuery(query)) continue;
        const label = query.replace(/^telegram grupos$/i, 'grupos de Telegram');
        const page = makeDefinition({ query, label, location, year, source: 'search-console' });
        pages.set(page.slug, page);
      }

      for (const topic of SAFE_TOPICS) {
        const query = `grupos telegram ${topic.slug.replace(/-/g, ' ')}`;
        const label = `grupos de Telegram de ${topic.label}`;
        const page = makeDefinition({ query, label, location, year, topic, source: 'firestore-topic' });
        pages.set(page.slug, page);
      }
    }
  }

  return Array.from(pages.values());
}

export function getSeoPageBySlug(slug) {
  const normalizedSlug = slugify(slug);
  return getSeoPageCatalog().find((page) => page.slug === normalizedSlug) || null;
}

export function getSafeTopicAliases() {
  return SAFE_TOPICS.flatMap((topic) => topic.aliases.map((alias) => ({ alias, topic })));
}

export function normalizeForSeoMatch(value) {
  return cleanText(value);
}
