'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from '@tabler/icons-react';
import {
  Box,
  Center,
  Group,
  Paper,
  ScrollArea,
  Badge,
  Table,
  Container,
  Text,
  TextInput,
  Button,
  UnstyledButton,
  Title,
} from '@mantine/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useMediaQuery } from '@mantine/hooks';
import slugify from '@/lib/slugify';
import styles from '@/app/styles/TableSortTelegram.module.css';
import Head from 'next/head';
import  { useRouter, usePathname, useSearchParams } from 'next/navigation';

const getCategoryUrl = (category, currentPath) => {
  // Detectar si estamos en la página de Telegram o WhatsApp
  if (currentPath.includes('/grupos-de-telegram')) {
    return `/comunidades/grupos-de-telegram/${slugify(category)}`;
  } else if (currentPath.includes('/grupos-de-whatsapp')) {
    return `/comunidades/grupos-de-whatsapp/${slugify(category)}`;
  } else {
    // Si estamos en la página general de comunidades, redirigir a Telegram por defecto
    return `/comunidades/grupos-de-telegram/${slugify(category)}`;
  }
};

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

import { useTranslation } from 'react-i18next';



function Th({ children, reversed, sorted, onSort }) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  
  return (
    <Table.Th>
      <UnstyledButton onClick={onSort} style={{ width: '100%' }}>
        <Group justify="space-between">
          <Text fw={600} size="xl" lh={1.2}>{children}</Text>
          <Center>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data, search, collectionFilter = []) {
  const query = search.toLowerCase().trim();

  return data.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(query) ||
      item.content18?.toLowerCase().includes(query) ||
      item.categories?.some(cat => cat.toLowerCase().includes(query));


    const matchesCollection = collectionFilter.length
      ? item.categories?.some((cat) =>
          collectionFilter.some((filtro) =>
            cat.toLowerCase().includes(filtro.toLowerCase())
          )
        )
      : true;

    return matchesSearch && matchesCollection;
  });
}

function sortData(data, { sortBy, reversed, search, collectionFilter }) {
  const filtered = filterData(data, search, collectionFilter);
  if (!sortBy) return filtered;
  
  return [...filtered].sort((a, b) =>
    reversed
  ? b[sortBy]?.localeCompare(a[sortBy])
  : a[sortBy]?.localeCompare(b[sortBy])
);
}

export default function Telegram() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  // const [sortBy, setSortBy] = useState(null);
  // const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCollections, setSelectedCollections] = useState([]);  // ✅ único estado
  const [collections, setCollections] = useState([]);
  
  
  // const [collections, setCollections] = useState([]);
  
  const pathname = usePathname();
  const searchParams = useSearchParams(); 
  const orden = searchParams.get('orden');
  

    useEffect(() => {
      setSortedData(
        sortData(data, { search, collectionFilter: selectedCollections })
      );
      setCurrentPage(1);               // regresa a página 1 si cambian filtros
    }, [data, search, selectedCollections]);

    useEffect(() => {
      // const orden = searchParams.get('orden');
      const cats = searchParams.get('cats')?.split(',') || [];

      setSelectedCollections(cats);
    }, [searchParams]);


    useEffect(() => {
      const fetchData = async () => {
        const snapshot = await getDocs(collection(db, 'groups'));
        const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const telegramGroups = groups.filter(g => g.tipo === 'telegram');

        const fetchCollections = async () => {
          // const snapshot = await getDocs(collection(db, 'colections'));
          // const docs = snapshot.docs.map(doc => doc.data());
          // const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
          // setCollections([...new Set(allCollections)]);
        };
        fetchCollections();

        let ordenados = [...telegramGroups];

        if (orden === 'top' || orden === 'vistos') {
          ordenados.sort((a, b) => b.visitas - a.visitas);
        } else if (orden === 'nuevos') {
          ordenados.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() ?? new Date(0);
            const dateB = b.createdAt?.toDate?.() ?? new Date(0);
            return dateB - dateA;
          });
        }


        setData(ordenados);
        setSortedData(ordenados);
      };

      fetchData();
    }, [searchParams]);

    const fetchCollections = async () => {
      const snapshot = await getDocs(collection(db, 'colections'));
      const docs = snapshot.docs.map(doc => doc.data());
      const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
      setCollections([...new Set(allCollections)]);
      // setCollections({ collections: [...new Set(allCollections)] });
    };
    fetchCollections();



  // const setSorting = (field) => {
  //   const reversed = field === sortBy ? !reverseSortDirection : false;
  //   setReverseSortDirection(reversed);
  //   setSortBy(field);
  //   setSortedData(sortData(data, { sortBy: field, reversed, search }));
  // };

  const handleSearchChange = (event) => {
    setSearch(event.currentTarget.value);
  };

  const groupsPerPage = 12;
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirstGroup, indexOfLastGroup);

  // 1️⃣  Calcula el idioma base una sola vez:
  const baseLang = i18n.language.split('-')[0]; // "en-US" → "en"
  

  // …

  const rows = currentGroups.map((row, idx) => {
    const slug = row.slug || slugify(row.name);

    // 2️⃣  Elige la descripción correcta para este row:
    const descriptionText =
      typeof row.description === 'object'
        ? row.description[baseLang]           // intento 1: "en"
          || row.description[i18n.language]   // intento 2: "en-US"
          || row.description['es']            // intento 3: español por defecto
        : row.description;
        
    const iconSrc = '/telegramicons.png'

    return (
        <Paper
          withBorder
          radius="md"
          shadow="xs"
          mb="sm"
          key={`${row.id}-${slug}-${idx}`}
          onClick={() => {
            const mainCategory = row.categories?.[0] || 'otros';
            const categoryUrl = getCategoryUrl(mainCategory, location.pathname);
            router.push(`${categoryUrl}/${slug}`);
          }}
        >

        <Table horizontalSpacing="md" withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {row.city && (
            <Text size="sm" >
              {countryMap[row.city] || row.city}
            </Text>
          )}
          <Text 
            fw={700}
            style={{
              marginLeft: '8px',
            }}
          >{row.name}</Text>         
           <img
            src={iconSrc}
            alt={row.name}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              objectFit: 'cover',
              marginLeft: 'auto',
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
                      ? 'Público'
                      : 'Apto para todo público'}
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
        {/* --- ETIQUETAS FUNDAMENTALES --- */}
        <title>Grupos de Telegram Activos por Categoría [2025] - JoinGroups.pro</title>
        <meta name="description" content="Encuentra y únete a los mejores grupos de Telegram en español. Listas actualizadas de enlaces de invitación a comunidades activas y canales." />
        <link rel="canonical" href="https://joingroups.pro/grupos-de-telegram" />

        {/* --- ETIQUETAS PARA REDES SOCIALES (OPEN GRAPH ) --- */}
        <meta property="og:title" content="Únete a los Mejores Grupos de Telegram | JoinGroups.pro" />
        <meta property="og:description" content="Explora miles de grupos de Telegram activos, organizados por temas como amistad, juegos, noticias y más. ¡Nuevos enlaces todos los días!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://joingroups.pro/grupos-de-telegram" />
        <meta property="og:image" content="https://joingroups.pro/JoinGroup.png" />

        {/* --- ETIQUETAS PARA TWITTER --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Grupos de Telegram Activos por Categoría [2025] - JoinGroups.pro" />
        <meta name="twitter:description" content="Encuentra y únete a los mejores grupos de Telegram en español. Listas actualizadas de enlaces de invitación." />
        <meta name="twitter:image" content="https://joingroups.pro/JoinGroup.png" />

        {/* --- ETIQUETAS ADICIONALES --- */}
        <meta name="keywords" content="grupos de telegram, enlaces de telegram, unirse a grupo telegram, canales de telegram, telegram grupos español, links de telegram" />
        <meta name="robots" content="index, follow" />
      </Head>


      <Container size="lg" px="md">
        <ScrollArea>

          <TextInput
            placeholder={t('Buscar por nombre, categoría o contenido...')}
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />
            <>
            <Group gap='xs' mb="md" justify="center">
            
              <Group gap='xs' mb="md" justify="center">
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
                  img src="/wapp.webp"
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

                <Group mt="md" mb="md">
                  <Button onClick={() => router.push('?orden=top')} variant={orden === 'top' ? 'filled' : 'light'}>Top</Button>
                  <Button onClick={() => router.push('?orden=nuevos')} variant={orden === 'nuevos' ? 'filled' : 'light'}>Nuevos</Button>
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
              </Group>


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
                  collections.map((cat, i) => {
                    const selected = selectedCollections.includes(cat);
                    return (
                      <Badge
                        key={i}
                        variant={selected ? 'filled' : 'light'}
                        color="violet"
                        size="lg"
                        radius="xl"
                        onClick={() => {
                          // Navegar a la página específica de la categoría
                          const categoryUrl = getCategoryUrl(cat, location.pathname);
                          router.push(categoryUrl);
                        }}
                        style={{
                          padding: '10px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          backgroundColor: selected ? '#5e2ca5' : '#f3e8ff',
                          color: selected ? '#ffffff' : '#4a0080',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease', // Añadir transición suave
                        }}
                      >
                        {cat}
                      </Badge>

                    );
                  })}
              </Box>
            </Group>

              <Paper
                withBorder
                radius="md"
                shadow="xs"
                mt="xl"
                p="md"
                style={{ backgroundColor: '#f9f9f9', marginBottom: '20px', paddingBottom: '10px' }}
              >

              {isMobile ? (
                <>
                  <Title order={4} mb="xs">
                    {t('Mejores Grupos de Telegram')}
                  </Title>
                  <Text size="sm" color="dimmed" mb="xs">
                    {t('¿Tienes un grupo de Telegram?')} <strong>{t('Publícalo gratis en JoinGroups')}</strong> {t('y consigue nuevos miembros fácilmente. Descubre cómo crecer con comunidades activas y visibles en toda la web.')}
                  </Text>
                </>
              ) : (
                <>
                  <Title order={3} mb="xs">
                    {t('Promociona tu Grupo de Telegram en JoinGroups')}
                  </Title>
                  <Text size="sm" color="dimmed" mb="xs">
                    {t('¿Tienes un grupo o canal en Telegram y quieres hacerlo crecer?')} <strong>{t('En JoinGroups puedes publicarlo gratis')}</strong> {t('y empezar a recibir nuevos miembros interesados.')}{' '}
                    {t('Explora los mejores grupos de Telegram organizados por temática, intereses y comunidad.')}{' '}
                    {t('Utiliza nuestro buscador y encuentra canales, consejos y recursos para hacer destacar tu grupo en el mundo Telegram.')}
                  </Text>
                </>
              )}

              </Paper>

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

              <Paper
                withBorder
                radius="md"
                shadow="xs"
                mt="xl"
                p="md"
                style={{ backgroundColor: '#f9f9f9', marginBottom: '20px', paddingBottom: '10px' }}
              >
              <Text size="md" fw={600} mb="sm">
                {t('¿Quieres que tu grupo de Telegram crezca y llegue a más personas?')}
              </Text>

              <Text size="sm" color="dimmed" mb="xs">
                {t('Publica tu grupo gratuitamente en')} <Link href="/" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link> {t('y conecta con una comunidad activa que comparte tus intereses.')}
                {t('Si aún no sabes cómo crear un grupo, puedes aprender fácilmente')} {' '}
                <Link href="/instrucciones-crear-grupo-telegram" style={{ color: '#228be6', textDecoration: 'underline' }}>
                  {t('aquí cómo crear tu grupo de Telegram')}
                </Link>.
              </Text>

              <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                {t('Únete a miles de usuarios que ya están haciendo crecer sus comunidades en Telegram.')}
              </Text>
              </Paper>
              <Button
                radius="md" 
                component={Link}
                href="/clanes/clanes-de-clash-royale"
                variant="light"
                color="blue"
                size="lg"
              >
                Ver clanes de Clash Royale
              </Button>
            </>
            <Text ta="center" fw={500} c="dimmed" mt="xl">
              {t('No se encontraron resultados.')}
            </Text>
        </ScrollArea>
      </Container>

    </>
  );
}
