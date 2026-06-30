'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconSearch, IconEye, IconChevronRight } from '@tabler/icons-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import { useTranslation } from 'react-i18next';
import Head from 'next/head';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import classes from '@/app/styles/TableSortTelegram.module.css';

const countryMap = {
  mx:'🇲🇽', us:'🇺🇸', ar:'🇦🇷', co:'🇨🇴', es:'🇪🇸', pe:'🇵🇪',
  cl:'🇨🇱', ve:'🇻🇪', br:'🇧🇷', ec:'🇪🇨', gt:'🇬🇹', bo:'🇧🇴',
  do:'🇩🇴', hn:'🇭🇳', py:'🇵🇾', sv:'🇸🇻', ni:'🇳🇮', cr:'🇨🇷',
  pa:'🇵🇦', uy:'🇺🇾', pr:'🇵🇷', ca:'🇨🇦', de:'🇩🇪', fr:'🇫🇷',
  it:'🇮🇹', gb:'🇬🇧', nl:'🇳🇱', pt:'🇵🇹', jp:'🇯🇵', kr:'🇰🇷',
  cn:'🇨🇳', in:'🇮🇳', ru:'🇷🇺', au:'🇦🇺',
};

const asCategoryArray = (categories) => {
  if (Array.isArray(categories)) return categories;
  if (!categories) return [];
  return [categories];
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatCategoryName = (value) => {
  if (!value) return '';
  return String(value)
    .split('-')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');
};

const getCategoryContent = (category, platform) => {
  const platformName = platform === 'telegram' ? 'Telegram' : 'WhatsApp';

  const categoryData = {
    'anime': {
      title: `Grupos de ${platformName} de Anime`,
      description: `Únete a los mejores grupos de ${platformName} de anime, manga y cultura otaku. Encuentra comunidades activas de tus series favoritas.`,
      content: {
        intro: `Descubre la comunidad de anime más grande en ${platformName}. Desde discusiones sobre los últimos episodios hasta recomendaciones de manga, aquí encontrarás todo lo relacionado con el mundo otaku.`,
        benefits: [
          'Discusiones en tiempo real sobre episodios recientes',
          'Recomendaciones personalizadas de anime y manga',
          'Comunidad activa de fans apasionados',
          'Acceso a contenido exclusivo y spoilers controlados',
        ],
        popular: 'Los grupos de anime más populares incluyen comunidades de Naruto, One Piece, Attack on Titan, Demon Slayer y muchos más.',
      },
    },
    'gaming': {
      title: `Grupos de ${platformName} de Gaming`,
      description: `Conecta con gamers de todo el mundo. Grupos de videojuegos, torneos, noticias gaming y comunidades de tus juegos favoritos.`,
      content: {
        intro: `La comunidad gaming de ${platformName} te espera. Desde juegos móviles hasta PC gaming, encuentra tu tribu de jugadores y mejora tu experiencia de juego.`,
        benefits: [
          'Equipos para juegos multijugador',
          'Noticias y actualizaciones de videojuegos',
          'Torneos y competencias organizadas',
          'Consejos y estrategias de expertos',
        ],
        popular: 'Encuentra grupos de Free Fire, PUBG, Fortnite, League of Legends, Valorant y muchos otros juegos populares.',
      },
    },
    'tecnologia': {
      title: `Grupos de ${platformName} de Tecnología`,
      description: `Mantente actualizado con las últimas tendencias tecnológicas. Grupos de programación, IA, criptomonedas y innovación.`,
      content: {
        intro: `Conecta con profesionales y entusiastas de la tecnología. Desde desarrollo de software hasta las últimas innovaciones en IA.`,
        benefits: [
          'Noticias tecnológicas en tiempo real',
          'Networking con profesionales del sector',
          'Recursos de aprendizaje y desarrollo',
          'Discusiones sobre tendencias emergentes',
        ],
        popular: 'Grupos especializados en Python, JavaScript, Machine Learning, Blockchain, Criptomonedas y más.',
      },
    },
    'estudio': {
      title: `Grupos de ${platformName} de Estudio`,
      description: `Grupos de estudio colaborativo, intercambio académico y apoyo educativo. Encuentra tu grupo de estudio ideal.`,
      content: {
        intro: `Mejora tu rendimiento académico con grupos de estudio colaborativo. Desde preparación para exámenes hasta intercambio de recursos educativos.`,
        benefits: [
          'Sesiones de estudio grupales organizadas',
          'Intercambio de materiales y recursos',
          'Apoyo mutuo entre estudiantes',
          'Técnicas de estudio efectivas',
        ],
        popular: 'Grupos para preparación de exámenes universitarios, idiomas, matemáticas, ciencias y más materias académicas.',
      },
    },
    'amistad': {
      title: `Grupos de ${platformName} de Amistad`,
      description: `Conoce nuevas personas y haz amigos genuinos. Grupos de amistad, chat social y comunidades para socializar.`,
      content: {
        intro: `Expande tu círculo social con grupos de amistad genuina. Conoce personas con intereses similares y crea conexiones duraderas.`,
        benefits: [
          'Ambiente seguro y moderado',
          'Actividades grupales y eventos',
          'Conversaciones significativas',
          'Comunidad inclusiva y diversa',
        ],
        popular: 'Grupos organizados por edad, ubicación, intereses comunes y actividades sociales.',
      },
    },
    '18': {
      title: `Grupos de ${platformName} +18`,
      description: `Contenido exclusivo para adultos. Grupos verificados +18 con acceso seguro y comunidades maduras.`,
      content: {
        intro: `Contenido exclusivo para mayores de edad. Comunidades maduras con moderación activa y ambiente respetuoso.`,
        benefits: [
          'Verificación de edad obligatoria',
          'Moderación activa 24/7',
          'Ambiente respetuoso y consensuado',
          'Contenido de calidad verificado',
        ],
        popular: 'Solo para mayores de 18 años. Acceso verificado y comunidades con normas claras.',
      },
    },
    'musica': {
      title: `Grupos de ${platformName} de Música`,
      description: `Descubre nueva música, comparte tus artistas favoritos y conecta con melómanos de todo el mundo.`,
      content: {
        intro: `La música nos une. Descubre nuevos géneros, artistas emergentes y conecta con personas que comparten tu pasión musical.`,
        benefits: [
          'Descubrimiento de música nueva',
          'Intercambio de playlists',
          'Discusiones sobre artistas y álbumes',
          'Eventos musicales y conciertos',
        ],
        popular: 'Grupos de todos los géneros: rock, pop, reggaeton, electrónica, jazz, clásica y música independiente.',
      },
    },
    'deportes': {
      title: `Grupos de ${platformName} de Deportes`,
      description: `Sigue tus deportes favoritos, discute resultados y conecta con fanáticos deportivos apasionados.`,
      content: {
        intro: `Vive la pasión deportiva con comunidades activas. Desde fútbol hasta deportes extremos, encuentra tu tribu deportiva.`,
        benefits: [
          'Resultados y noticias en tiempo real',
          'Análisis y predicciones deportivas',
          'Comunidad de fanáticos apasionados',
          'Organización de eventos deportivos',
        ],
        popular: 'Grupos de fútbol, básquetbol, tenis, MMA, F1 y todos los deportes populares.',
      },
    },
    'tributos': {
      title: `Grupos de ${platformName} de Tributos 2026`,
      description: `Encuentra los mejores grupos de tributos en ${platformName} actualizados 2026. Comunidad activa de tributos verificados. Únete gratis a los mejores canales de tributos.`,
      content: {
        intro: `Descubre la comunidad de tributos más activa en ${platformName}. Grupos verificados con contenido exclusivo y miembros activos.`,
        benefits: [
          'Comunidad activa y verificada',
          'Contenido exclusivo actualizado',
          'Enlaces verificados sin spam',
          'Ambiente respetuoso y moderado',
        ],
        popular: 'Los grupos de tributos más populares con cientos de miembros activos y contenido actualizado a diario.',
      },
    },
    'grupos-caseros': {
      title: `Grupos ${platformName} Caseros España 2026 | Comunidad Española`,
      description: `Grupos de ${platformName} caseros en España actualizados 2026. Encuentra comunidades españolas de caseros verificadas. Únete a los mejores grupos caseros de España.`,
      content: {
        intro: `La comunidad de caseros española más grande en ${platformName}. Grupos verificados con contenido casero de calidad.`,
        benefits: [
          'Comunidad española activa',
          'Contenido casero verificado',
          'Miembros de toda España',
          'Grupos moderados y seguros',
        ],
        popular: 'Grupos caseros españoles con miembros activos de Madrid, Barcelona, Valencia y toda España.',
      },
    },
    'caseros': {
      title: `Grupos ${platformName} Caseros 2026 | Comunidad Activa`,
      description: `Encuentra los mejores grupos caseros en ${platformName} actualizados 2026. Comunidad activa y verificada. Únete gratis a los grupos caseros más populares.`,
      content: {
        intro: `Descubre la mejor comunidad casera en ${platformName}. Grupos verificados con contenido exclusivo.`,
        benefits: [
          'Comunidad activa',
          'Contenido verificado',
          'Enlaces actualizados',
          'Ambiente respetuoso',
        ],
        popular: 'Los grupos caseros más populares del momento en Telegram.',
      },
    },
    'desnudas': {
      title: `Grupos de ${platformName} de Desnudas 2026 | Canales Activos`,
      description: `Encuentra los mejores canales de ${platformName} con contenido de desnudas actualizado 2026. Comunidad activa y verificada. Únete gratis a los grupos más populares.`,
      content: {
        intro: `Explora los mejores canales de ${platformName} con contenido de desnudas, comunidades activas y verificadas.`,
        benefits: [
          'Comunidad activa y verificada',
          'Contenido actualizado a diario',
          'Enlaces seguros y revisados',
          'Canales con miles de miembros',
        ],
        popular: 'Los canales de desnudas más populares con contenido exclusivo y actualizado.',
      },
    },
    'packs': {
      title: `Packs ${platformName} 2026 | Mejores Canales de Packs`,
      description: `Encuentra los mejores packs de ${platformName} actualizados 2026. Canales verificados con contenido exclusivo. Únete a packs activos.`,
      content: {
        intro: `Los mejores packs en ${platformName} actualizados. Canales verificados con contenido exclusivo para miembros.`,
        benefits: [
          'Packs verificados y actualizados',
          'Contenido exclusivo',
          'Canales activos con miles de miembros',
          'Actualización constante',
        ],
        popular: 'Los packs más populares del momento en Telegram con contenido exclusivo.',
      },
    },
    'peliculas': {
      title: `Grupos de ${platformName} de Películas 2026 | Canales de Cine`,
      description: `Encuentra los mejores grupos de ${platformName} para ver películas actualizados 2026. Canales verificados con contenido cinematográfico. Únete gratis a comunidades de cine.`,
      content: {
        intro: `Descubre los mejores grupos de ${platformName} para ver películas, canales verificados con contenido cinematográfico actualizado.`,
        benefits: [
          'Películas actualizadas a diario',
          'Canales verificados sin spam',
          'Variedad de géneros y estrenos',
          'Comunidad de cinéfilos activa',
        ],
        popular: 'Grupos de cine con estrenos, clásicos y películas de todos los géneros.',
      },
    },
  };

  return categoryData[category] || {
    title: `Grupos de ${platformName} de ${formatCategoryName(category)}`,
    description: `Encuentra y únete a los mejores grupos de ${platformName} de ${formatCategoryName(category)}. Comunidades activas y verificadas.`,
    content: {
      intro: `Descubre la mejor comunidad de ${formatCategoryName(category)} en ${platformName}. Conecta con personas que comparten tus intereses.`,
      benefits: [
        'Comunidad activa y participativa',
        'Contenido relevante y actualizado',
        'Moderación profesional',
        'Ambiente seguro y respetuoso',
      ],
      popular: `Encuentra los grupos más activos y populares de ${formatCategoryName(category)}.`,
    },
  };
};

const extraCategoryContent = {
  anime: {
    title: 'Géneros de anime más populares',
    text: 'Encuentra grupos especializados en Shonen, Seinen, Shojo, Isekai y comunidades activas de series populares.',
  },
  gaming: {
    title: 'Plataformas de gaming cubiertas',
    text: 'Desde gaming móvil hasta PC y consolas: busca equipos, torneos, noticias y comunidades de tus juegos favoritos.',
  },
  tecnologia: {
    title: 'Áreas tecnológicas especializadas',
    text: 'Programación, inteligencia artificial, blockchain, ciberseguridad, DevOps y networking profesional.',
  },
  '18': {
    title: 'Acceso verificado y seguro',
    text: 'Comunidades para adultos con normas claras, moderación activa y enfoque en respeto y consentimiento.',
  },
};

function filterData(data, search, category) {
  const query = search.toLowerCase().trim();
  const normalizedCategory = String(category || '').toLowerCase();

  return data.filter((item) => {
    const categories = asCategoryArray(item.categories);
    const matchesSearch = !query ||
      item.name?.toLowerCase().includes(query) ||
      item.content18?.toLowerCase().includes(query) ||
      categories.some(cat => String(cat).toLowerCase().includes(query));

    const matchesCategory = categories.some((cat) =>
      slugify(cat).toLowerCase() === normalizedCategory
    );

    return matchesSearch && matchesCategory;
  });
}

function sortData(data, { search, category, orden }) {
  const filtered = filterData(data, search, category);

  if (orden === 'top' || orden === 'vistos') {
    filtered.sort((a, b) => (b.visitas ?? 0) - (a.visitas ?? 0));
  } else if (orden === 'nuevos') {
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() ?? new Date(0);
      const dateB = b.createdAt?.toDate?.() ?? new Date(0);
      return dateB - dateA;
    });
  }

  return filtered;
}

export default function CategoryPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathParts = pathname?.split('/') || [];
  // pathname ej: /comunidades/grupos-de-telegram/packs
  //   [0]='' [1]='comunidades' [2]='grupos-de-telegram' [3]='packs'
  const initialPlatform = pathParts?.[2]?.replace('grupos-de-', '') || 'telegram';
  const initialCategory = pathParts?.[3] || '';

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [platform, setPlatform] = useState(initialPlatform);
  const [showAllCats, setShowAllCats] = useState(false);

  const orden = searchParams.get('orden');
  const lang = i18n.language || 'es';
  const baseLang = lang.split('-')[0];
  const platformName = platform === 'whatsapp' ? 'WhatsApp' : 'Telegram';
  const platformKey = platform === 'whatsapp' ? 'whatsapp' : 'telegram';
  const platformIcon = platformKey === 'telegram' ? '/telegramicons.png' : '/wapp.webp';
  const categoryLabel = formatCategoryName(category);
  const categoryContent = getCategoryContent(category, platformKey);
  const categoryExtra = extraCategoryContent[category];
  const groupsPerPage = 12;
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(sortedData.length / groupsPerPage);
  const collectionsExist = Array.isArray(collections) && collections.length > 0;

  useEffect(() => {
    // pathname ej: /comunidades/grupos-de-telegram/packs
    //   [0]='' [1]='comunidades' [2]='grupos-de-telegram' [3]='packs'
    const currentPlatform = pathParts?.[2]?.replace('grupos-de-', '') || 'telegram';
    const currentCategory = pathParts?.[3] || '';

    setPlatform(currentPlatform);
    setCategory(currentCategory);
  }, [pathname]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'groups'));
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const platformGroups = groups.filter(g => g.tipo?.trim().toLowerCase() === platformKey);

      setData(platformGroups);
    };

    fetchData();
  }, [platformKey]);

  useEffect(() => {
    const fetchCollections = async () => {
      const snapshot = await getDocs(collection(db, 'colections'));
      const docs = snapshot.docs.map(doc => doc.data());
      const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
      setCollections([...new Set(allCollections)]);
    };

    fetchCollections();
  }, []);

  useEffect(() => {
    const sorted = sortData(data, { search, category, orden });
    setSortedData(sorted);
    setCurrentPage(1);
  }, [data, search, category, orden]);

  const setOrden = (value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('orden', value);
    } else {
      params.delete('orden');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const getDesc = (row) => {
    if (row.description && typeof row.description === 'object') {
      return row.description[baseLang] || row.description[lang] || row.description.es || row.description.en || '';
    }

    return row.description || '';
  };

  return (
    <>
      <Head>
        <title>{categoryContent.title}</title>
        <meta name="description" content={categoryContent.description} />
        <link rel="canonical" href={`https://www.joingroups.lat/comunidades/grupos-de-${platformKey}/${category}`} />
        <meta property="og:title" content={categoryContent.title} />
        <meta property="og:description" content={categoryContent.description} />
        <meta property="og:type" content="website" />
      </Head>

      <div className={classes.pageBg}>
        <div className={classes.wrapper}>
          <div className={classes.hero}>
            <div className={classes.eyebrow}>
              <span className={classes.eyebrowDot} />
              Directorio verificado
            </div>
            <h1 className={classes.pageTitle}>{categoryLabel || platformName}</h1>
            <p className={classes.pageSub}>
              {sortedData.length} grupos disponibles
            </p>
          </div>

          <div className={classes.platformRow}>
            <button
              className={`${classes.platformBtn} ${platformKey === 'telegram' ? classes.platformBtnActive : ''}`}
              onClick={() => router.push('/comunidades/grupos-de-telegram')}
            >
              <img src="/telegramicons.png" alt="Telegram" style={{ width: 15, height: 15 }} />
              Telegram
            </button>
            <button
              className={`${classes.platformBtn} ${platformKey === 'whatsapp' ? classes.platformBtnActive : ''}`}
              onClick={() => router.push('/comunidades/grupos-de-whatsapp')}
            >
              <img src="/wapp.webp" alt="WhatsApp" style={{ width: 15, height: 15, borderRadius: 4 }} />
              WhatsApp
            </button>
            <button
              className={`${classes.platformBtn} ${!platformKey ? classes.platformBtnActive : ''}`}
              onClick={() => router.push('/comunidades')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: -2 }}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Comunidades
            </button>
          </div>

          <div className={classes.controlsBar}>
            <div className={classes.searchBox}>
              <IconSearch size={15} className={classes.searchIcon} />
              <input
                className={classes.searchInput}
                placeholder={t(`Buscar grupos de ${categoryLabel || platformName}...`)}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={classes.sortRow}>
            {[
              { label: 'Destacados', val: null },
              { label: 'Top vistos', val: 'top' },
              { label: 'Nuevos', val: 'nuevos' },
            ].map(({ label, val }) => (
              <button
                key={label}
                className={`${classes.sortPill} ${orden === val ? classes.sortPillActive : ''}`}
                onClick={() => setOrden(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Categorías — una sola fila con scroll */}
          <div className={classes.categoryRow}>
            <Link
              href={`/comunidades/grupos-de-${platformKey}`}
              className={`${classes.categoryPill} ${!category ? classes.categoryPillActive : ''}`}
            >
              Todas
            </Link>
            {[
              { slug: 'tributos', label: 'Tributos Telegram' },
              { slug: 'grupos-caseros', label: 'Grupos Caseros España' },
              { slug: 'packs', label: 'Packs Telegram' },
              { slug: 'desnudas', label: 'Telegram Desnudas' },
              { slug: 'peliculas', label: 'Películas Telegram' },
            ]
              .filter(cat => cat.slug !== String(category || '').toLowerCase())
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/comunidades/grupos-de-${platformKey}/${cat.slug}`}
                  className={classes.categoryPill}
                >
                  {cat.label}
                </Link>
              ))}
            {collections
              .filter(cat => slugify(cat).toLowerCase() !== String(category || '').toLowerCase())
              .map((cat) => (
                <Link
                  key={cat}
                  href={`/comunidades/grupos-de-${platformKey}/${slugify(cat)}`}
                  className={classes.categoryPill}
                >
                  {cat}
                </Link>
              ))}
          </div>

          {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
            const categories = asCategoryArray(row.categories);
            const slug = row.slug || slugify(row.name);
            const mainCat = categories[0] || categoryLabel || 'otros';
            const desc = getDesc(row);
            const detailCategory = category || slugify(mainCat);

            return (
              <div
                key={`${row.id}-${idx}`}
                className={classes.groupCard}
                onClick={() => router.push(`/comunidades/grupos-de-${platformKey}/${detailCategory}/${slug}`)}
              >
                <div className={classes.groupCardTop}>
                  <div className={classes.groupAvatar}>
                    <img src={platformIcon} alt={platformName} />
                  </div>
                  <div className={classes.groupInfo}>
                    <div className={classes.groupName}>{row.name}</div>
                    <div className={classes.groupMeta}>
                      {row.city && countryMap[row.city] && (
                        <>
                          <span className={classes.groupFlag}>{countryMap[row.city]}</span>
                          <span className={classes.groupMetaDot} />
                        </>
                      )}
                      {row.content18 === 'Sí' && (
                        <span className={classes.badge18}>18+</span>
                      )}
                    </div>
                  </div>
                  <IconChevronRight size={16} style={{ color: '#D4D4D4', flexShrink: 0 }} />
                </div>

                {desc && <div className={classes.groupDesc}>{desc}</div>}

                <div className={classes.groupFooter}>
                  <span className={classes.groupCategory}>{mainCat}</span>
                  <span className={classes.groupViews}>
                    <IconEye size={11} />
                    {row.visitas ?? 0}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className={classes.emptyState}>
              <p>{t(`No se encontraron grupos de ${categoryLabel || category} en este momento.`)}</p>
              <Link href="/comunidades/subir-grupo" className={classes.emptyAction}>
                {t('Publicar mi grupo')}
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className={classes.pagination}>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ««
              </button>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ← {t('Anterior')}
              </button>
              <span className={classes.pageInfo}>{currentPage} / {totalPages}</span>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                {t('Siguiente')} →
              </button>
            </div>
          )}

          <div className={classes.footerCta}>
            <p className={classes.footerCtaTitle}>Cómo unirse a grupos de {categoryLabel || category} en {platformName}</p>
            <p className={classes.footerCtaText}>
              Unirse a estos grupos es gratis. Abre cualquier comunidad, revisa su descripción y accede desde el enlace verificado. Si tienes un grupo de {categoryLabel || category},{' '}
              <Link href="/comunidades/subir-grupo">publícalo gratis en JoinGroups</Link> para llegar a más usuarios interesados.
            </p>
            <Link href={`/comunidades/grupos-de-${platformKey}`} className={classes.clashBtn}>
              Ver todos los grupos de {platformName} →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
