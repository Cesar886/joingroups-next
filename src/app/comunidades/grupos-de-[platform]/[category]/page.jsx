'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconSearch,
} from '@tabler/icons-react';
import {
  Box,
  Group,
  Paper,
  ScrollArea,
  Container,
  Badge,
  Table,
  Text,
  TextInput,
  Button,
  Title,
} from '@mantine/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useMediaQuery } from '@mantine/hooks';
import slugify from '@/lib/slugify'; // Asegúrate de que esta ruta sea correcta
import { useTranslation } from 'react-i18next';
import Head from 'next/head';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';


// Mapa de países para emojis (si lo usas en tus grupos)
const countryMap = {
  mx: '🇲🇽',
  us: '🇺🇸',
  ar: '🇦🇷',
  co: '🇨🇴',
  es: '🇪🇸',
  pe: '🇵🇪',
  cl: '🇨🇱',
  ve: '🇻🇪',
  br: '🇧🇷',
  ec: '🇪🇨',
  gt: '🇬🇹',
  bo: '🇧🇴',
  do: '🇩🇴',
  hn: '🇭🇳',
  py: '🇵🇾',
  sv: '🇸🇻',
  ni: '🇳🇮',
  cr: '🇨🇷',
  pa: '🇵🇦',
  uy: '🇺🇾',
  pr: '🇵🇷',
  ca: '🇨🇦',
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  gb: '🇬🇧',
  nl: '🇳🇱',
  pt: '🇵🇹',
  jp: '🇯🇵',
  kr: '🇰🇷',
  cn: '🇨🇳',
  in: '🇮🇳',
  ru: '🇷🇺',
  au: '🇦🇺',
};

// Función para capitalizar la primera letra de una cadena
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Función para generar contenido único por categoría (SEO y UX)
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
          'Acceso a contenido exclusivo y spoilers controlados'
        ],
        popular: 'Los grupos de anime más populares incluyen comunidades de Naruto, One Piece, Attack on Titan, Demon Slayer y muchos más.'
      }
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
          'Consejos y estrategias de expertos'
        ],
        popular: 'Encuentra grupos de Free Fire, PUBG, Fortnite, League of Legends, Valorant y muchos otros juegos populares.'
      }
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
          'Discusiones sobre tendencias emergentes'
        ],
        popular: 'Grupos especializados en Python, JavaScript, Machine Learning, Blockchain, Criptomonedas y más.'
      }
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
          'Técnicas de estudio efectivas'
        ],
        popular: 'Grupos para preparación de exámenes universitarios, idiomas, matemáticas, ciencias y más materias académicas.'
      }
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
          'Comunidad inclusiva y diversa'
        ],
        popular: 'Grupos organizados por edad, ubicación, intereses comunes y actividades sociales.'
      }
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
          'Contenido de calidad verificado'
        ],
        popular: 'Solo para mayores de 18 años. Acceso verificado y comunidades con normas claras.'
      }
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
          'Eventos musicales y conciertos'
        ],
        popular: 'Grupos de todos los géneros: rock, pop, reggaeton, electrónica, jazz, clásica y música independiente.'
      }
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
          'Organización de eventos deportivos'
        ],
        popular: 'Grupos de fútbol, básquetbol, tenis, MMA, F1 y todos los deportes populares.'
      }
    }
  };

  // Contenido genérico si la categoría no está definida explícitamente
  return categoryData[category] || {
    title: `Grupos de ${platformName} de ${capitalize(category)}`,
    description: `Encuentra y únete a los mejores grupos de ${platformName} de ${capitalize(category)}. Comunidades activas y verificadas.`,
    content: {
      intro: `Descubre la mejor comunidad de ${capitalize(category)} en ${platformName}. Conecta con personas que comparten tus intereses.`,
      benefits: [
        'Comunidad activa y participativa',
        'Contenido relevante y actualizado',
        'Moderación profesional',
        'Ambiente seguro y respetuoso'
      ],
      popular: `Encuentra los grupos más activos y populares de ${capitalize(category)}.`
    }
  };
};

// Función para filtrar datos por búsqueda y categoría
function filterData(data, search, category) {
  const query = search.toLowerCase().trim();

  return data.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(query) ||
      item.content18?.toLowerCase().includes(query) ||
      item.categories?.some(cat => cat.toLowerCase().includes(query));

    // Asegurarse de que la categoría del grupo coincida con la categoría de la URL
    const matchesCategory = item.categories?.some((cat) =>
      // Aplicar slugify a la categoría del item antes de comparar con el slug de la URL
      slugify(cat).toLowerCase() === category.toLowerCase()
    );

    return matchesSearch && matchesCategory;
  });
}

// Función para ordenar datos (top, nuevos, destacados)
function sortData(data, { search, category, orden }) {
  let filtered = filterData(data, search, category);
  
  if (orden === 'top' || orden === 'vistos') {
    filtered.sort((a, b) => b.visitas - a.visitas);
  } else if (orden === 'nuevos') {
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() ?? new Date(0);
      const dateB = b.createdAt?.toDate?.() ?? new Date(0);
      return dateB - dateA;
    });
  }
  // 'destacados' mantiene el orden original (por defecto de Firebase o el que venga)
  
  return filtered;
}

export default function CategoryPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();   
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]); // Para los badges de otras categorías
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  
  const orden = searchParams.get('orden'); // Obtiene el parámetro de ordenamiento (ej. 'top')
  
  // Determinar el tipo de plataforma (telegram/whatsapp) desde la URL
  const platformName = capitalize(platform); // 'Telegram' o 'Whatsapp'

  useEffect(() => {
    const pathParts = pathname?.split('/');
    const currentPlatform = pathParts?.[3]?.replace('grupos-de-', '');
    const currentCategory = pathParts?.[4];

    setPlatform(currentPlatform);
    setCategory(currentCategory);
  }, [pathname]);
  
  // Obtener contenido específico de la categoría para SEO y UX
  const categoryContent = getCategoryContent(category, platform);
  
  // Efecto para cargar los datos de los grupos
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'groups'));
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrar por la plataforma actual (telegram o whatsapp)
      const platformGroups = groups.filter(g => g.tipo?.trim().toLowerCase() === platform);
      
      setData(platformGroups);
    };
    
    fetchData();
  }, [platform]); // Se ejecuta cuando cambia la plataforma (navegación entre Telegram/WhatsApp)

  // Efecto para cargar todas las colecciones (para los badges de otras categorías)
  useEffect(() => {
    const fetchCollections = async () => {
      const snapshot = await getDocs(collection(db, 'colections'));
      const docs = snapshot.docs.map(doc => doc.data());
      const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
      setCollections([...new Set(allCollections)]);
    };
    
    fetchCollections();
  }, []);

  // Efecto para aplicar el ordenamiento y filtrado cuando cambian los datos, búsqueda, categoría u orden
  useEffect(() => {
    const sorted = sortData(data, { search, category, orden });
    setSortedData(sorted);
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros/orden
  }, [data, search, category, orden]);

  // Manejador para el cambio en la barra de búsqueda
  const handleSearchChange = (event) => {
    setSearch(event.currentTarget.value);
  };

  // Lógica de paginación
  const groupsPerPage = 12;
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirstGroup, indexOfLastGroup);

  // Determinar el idioma base para descripciones multilingües
  const baseLang = i18n.language.split('-')[0];

  // Mapear los grupos actuales a filas de la tabla (o Paper components)
  const rows = currentGroups.map((row, idx) => {
    const slug = row.slug || slugify(row.name);

    const descriptionText =
      typeof row.description === 'object'
        ? row.description[baseLang] || row.description[i18n.language] || row.description['es']
        : row.description;
        
    const iconSrc = platform === 'telegram' ? '/telegramicons.png' : '/wapp.webp';

    return (
      <Paper
        withBorder
        radius="md"
        shadow="xs"
        mb="sm"
        key={`${row.id}-${slug}-${idx}`}
        onClick={() => router.push(`/comunidades/grupos-de-${platform}/${slug}`)} // Navega al detalle del grupo
        style={{ cursor: 'pointer' }} // Indica que es clickeable
      >
        <Table horizontalSpacing="md" withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={3}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {row.city && (
                    <Text size="sm">
                      {countryMap[row.city] || row.city}
                    </Text>
                  )}
                  <Text 
                    fw={700}
                    style={{ marginLeft: '8px' }}
                  >
                    {row.name}
                  </Text>
                  <img
                    src={iconSrc}
                    alt={row.name}
                    style={{
                      width: platform === 'telegram' ? '24px' : '39px',
                      height: platform === 'telegram' ? '24px' : '39px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      marginLeft: 'auto',
                      marginRight: platform === 'telegram' ? '9px' : '0px',
                      marginTop: platform === 'telegram' ? '5px' : '0px',
                    }}
                  />
                </div>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td width="33%">
                <Text>{t(row.categories)}</Text>
                <Text size="xs" c="dimmed">{t('Categoría')}</Text>
              </Table.Td>
              <Table.Td width="33%">
                <Text>
                  {row.content18 === 'Sí'
                    ? '18+'
                    : isMobile
                      ? t('Público')
                      : t('Apto para todo público')}
                </Text>
                <Text size="xs" c="dimmed">{t('Contenido')}</Text>
              </Table.Td>
              <Table.Td width="33%">
                <Text>{row.visitas}</Text>
                <Text size="xs" c="dimmed">{t('Vistas')}</Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        <Box p="sm" style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
          <Text
            lineClamp={1}
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {descriptionText}
          </Text>
        </Box>
      </Paper>
    );
  });

  const collectionsExist = Array.isArray(collections) && collections.length > 0;

  return (
    <>
      <Head>
        <title>{categoryContent.title}</title>
        <meta name="description" content={categoryContent.description} />
        <link
          rel="canonical"
          href={`https://www.joingroups.lat/comunidades/grupos-de-${platform}/${category}`}
        />

        <meta property="og:title" content={categoryContent.title} />
        <meta property="og:description" content={categoryContent.description} />
        <meta property="og:type" content="website" />
      </Head>

      <Container size="lg" px="md">
        <ScrollArea>
          <TextInput
            placeholder={t(`Buscar grupos de ${category}...`)}
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />

          <Group gap='xs' mb="md" justify="center">
            {/* Botones de Plataforma (Telegram/WhatsApp) */}
            <Button
              variant="light"
              size="xs"
              radius="md"
              onClick={() => router.push('/comunidades/grupos-de-telegram')}
              leftSection={
                <img
                  src="/telegramicons.png"
                  alt="Telegram"
                  style={{ width: 16, height: 16 }}
                />
              }
            >
              {t('Telegram')}
            </Button>

            <Button
              variant="light"
              size="xs"
              radius="md"
              onClick={() => router.push('/comunidades/grupos-de-whatsapp')}
              leftSection={
                <img
                  src="/wapp.webp"
                  alt="Whatsapp"
                  style={{ width: 29, height: 29 }}
                />
              }
            >
              {t('Whatsapp')}
            </Button>

            {/* Botones de Ordenamiento (Top, Nuevos, Destacados) */}
            <Group mt="md" mb="md">
              <Button
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  const currentOrden = params.get('orden');
                  if (currentOrden === 'top') {
                    params.delete('orden'); // quitar si ya estaba activo
                  } else {
                    params.set('orden', 'top');
                  }
                  const search = params.toString();
                  router.push(`?${search}`);
                }}
                variant={orden === 'top' ? 'filled' : 'light'}
              >
                Top
              </Button>

              <Button
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  const currentOrden = params.get('orden');
                  if (currentOrden === 'nuevos') {
                    params.delete('orden');
                  } else {
                    params.set('orden', 'nuevos');
                  }
                  const search = params.toString();
                  router.push(`?${search}`);                  
                }}
                variant={orden === 'nuevos' ? 'filled' : 'light'}
              >
                Nuevos
              </Button>

              <Button
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  params.delete('orden'); // quitar orden para mostrar "destacados"
                  const search = params.toString();
                  router.push(`?${search}`);
                }}
                variant={!orden ? 'filled' : 'light'}
              >
                Destacados
              </Button>
            </Group>

            {/* BADGES DE OTRAS CATEGORÍAS */}
            <Box
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '10px',
                padding: '10px 0',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {collectionsExist &&
                collections
                .filter(cat => slugify(cat).toLowerCase() !== (category || '').toLowerCase())
                  .map((cat, i) => (
                    <Badge
                      key={i}
                      variant="light"
                      color="violet"
                      size="lg"
                      radius="xl"
                      onClick={() => router.push(`/comunidades/grupos-de-${platform}/${slugify(cat)}`)}
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        backgroundColor: '#f3e8ff',
                        color: '#4a0080',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {cat}
                    </Badge>
                  ))}
            </Box>
          </Group>

          <Paper
          withBorder
          radius="md"
          shadow="xs"
          mt={isMobile ? 'md' : 'xl'}
          p={isMobile ? 'sm' : 'md'}
          style={{
              backgroundColor: '#f9f9f9',
              marginBottom: isMobile ? '12px' : '20px',
              paddingBottom: isMobile ? '6px' : '10px',
          }}
          >

          <Title order={1} mb="sm">
              {categoryContent.title} Activos 2026
          </Title>

          <Text size="md" mb="md">
              {isMobile
              ? categoryContent.content.intro.slice(0, 100) + '...'
              : categoryContent.content.intro}
          </Text>

          <Title order={3} mb="sm">
              ¿Por qué elegir nuestros grupos de {capitalize(category)}?
          </Title>

          <Box mb="md">
              {categoryContent.content.benefits.slice(0, isMobile ? 2 : categoryContent.content.benefits.length).map((benefit, index) => (
              <Text key={index} size="sm" mb="xs" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#5e2ca5', marginRight: '8px', fontWeight: 'bold' }}>✓</span>
                  {benefit}
              </Text>
              ))}
          </Box>

          <Text size="sm" c="dimmed" mb="md">
              {isMobile
              ? categoryContent.content.popular.slice(0, 80) + '...'
              : categoryContent.content.popular}
          </Text>

          {/* CONTENIDO ESPECÍFICO ADICIONAL POR CATEGORÍA */}
          {category === 'anime' && (
              <Box mb="md">
              <Title order={4} mb="xs">Géneros de Anime Más Populares</Title>
              <Text size="sm" c="dimmed">
                  {isMobile
                  ? 'Grupos de Shonen, Seinen, Isekai y más.'
                  : 'Encuentra grupos especializados en Shonen (Naruto, Dragon Ball), Seinen (Attack on Titan, Tokyo Ghoul), Shojo (Sailor Moon, Fruits Basket), Isekai (Re:Zero, Overlord) y muchos más géneros. Cada grupo está moderado por fans expertos que mantienen discusiones de calidad.'}
              </Text>
              </Box>
          )}

          {category === 'gaming' && (
              <Box mb="md">
              <Title order={4} mb="xs">Plataformas de Gaming Cubiertas</Title>
              <Text size="sm" c="dimmed">
                  {isMobile
                  ? 'Grupos de Free Fire, LoL, Valorant y más.'
                  : 'Desde gaming móvil (Free Fire, PUBG Mobile, Call of Duty Mobile) hasta PC gaming (Valorant, CS:GO, League of Legends) y consolas (FIFA, Fortnite, Apex Legends). Encuentra equipos, participa en torneos y mejora tu gameplay.'}
              </Text>
              </Box>
          )}

          {category === 'tecnologia' && (
              <Box mb="md">
              <Title order={4} mb="xs">Áreas Tecnológicas Especializadas</Title>
              <Text size="sm" c="dimmed">
                  {isMobile
                  ? 'Grupos de programación, IA y más.'
                  : 'Programación (Python, JavaScript, React), Inteligencia Artificial, Blockchain y Criptomonedas, Ciberseguridad, DevOps, y las últimas tendencias en tecnología. Networking profesional y oportunidades laborales.'}
              </Text>
              </Box>
          )}

          {category === '18' && (
              <Box mb="md">
              <Title order={4} mb="xs">Acceso Verificado y Seguro</Title>
              <Text size="sm" c="dimmed">
                  {isMobile
                  ? 'Grupos verificados +18 con normas claras.'
                  : 'Todos nuestros grupos +18 requieren verificación de edad. Moderación activa 24/7, normas claras de respeto y consenso. Ambiente maduro y responsable para adultos.'}
              </Text>
              </Box>
          )}
          </Paper>


          {rows.length > 0 ? (
            <>
              {rows}
              
              <Group mt="xl" justify="center" gap="xs">
                <Button
                  variant="light"
                  size="xs"
                  radius="md"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  {t('Inicio (paginación)')}
                </Button>
                <Button
                  variant="subtle"
                  size="xs"
                  radius="md"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← {t('Anterior')}
                </Button>
                <Text size="sm" fw={500} mt={4}>
                  {t('Página')} <strong>{currentPage}</strong>
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  radius="md"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      indexOfLastGroup < sortedData.length ? prev + 1 : prev
                    )
                  }
                  disabled={indexOfLastGroup >= sortedData.length}
                >
                  {t('Siguiente')} →
                </Button>
              </Group>
            </>
          ) : (
            <Box ta="center" mt="xl">
              <Text fw={500} c="dimmed" mb="sm">
                {t(`No se encontraron grupos de ${category} en este momento.`)}
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                {t('¿Tienes un grupo de esta categoría? ¡Publícalo gratis!')}
              </Text>
              <Button
                component={Link}
                href="/comunidades/subir-grupo"
                variant="filled"
                color="violet"
              >
                {t('Publicar mi grupo')}
              </Button>
            </Box>
          )}

          <Paper
            withBorder
            radius="md"
            shadow="xs"
            mt="xl"
            p="md"
            style={{ backgroundColor: '#f9f9f9', marginBottom: '20px' }}
          >
            <Title order={3} mb="sm">
              Cómo Unirse a Grupos de {capitalize(category)} en {platformName}
            </Title>

            <Text size="sm" color="dimmed" mb="md">
              Unirse a nuestros grupos de {category} es completamente gratuito y seguro. 
              Simplemente haz clic en cualquier grupo que te interese y serás redirigido automáticamente a {platformName}. 
              Todos los enlaces están verificados y actualizados regularmente para garantizar el acceso.
            </Text>

            <Text size="sm" color="dimmed" mb="md">
              ¿Tienes un grupo de {category} y quieres hacerlo crecer? {' '}
              <Link href="/comunidades/subir-grupo" style={{ color: '#228be6', textDecoration: 'underline' }}>
                Publícalo gratis en JoinGroups
              </Link> y llega a miles de usuarios interesados en {category}.
            </Text>

            <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
              Grupos de {capitalize(category)}, {platformName} {category}, Comunidades de {category}, 
              Enlaces {category}, Unirse grupos {category}, {category} 2026
            </Text>
          </Paper>
        </ScrollArea>
      </Container>

    </>
  );
}
