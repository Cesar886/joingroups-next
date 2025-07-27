'use client';

import { useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
  IconSwords,
} from '@tabler/icons-react';
import {
  Box,
  Center,
  Group,
  Container,
  Paper,
  ScrollArea,
  Badge,
  Table,
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
import styles from '@/app/styles/TableSortClanes.module.css';
import Head from 'next/head';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';


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

function filterData(data, search, collectionFilter = null) {
  const query = search.toLowerCase().trim();
  return data.filter((item) => {
    const matchesSearch = ['name', 'categories', 'content18'].some((key) =>
      item[key]?.toLowerCase().includes(query)
  );
  
  const matchesCollection = collectionFilter
  ? item.categories?.toLowerCase() === collectionFilter.toLowerCase()
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

export default function Clanes() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  // const [sortBy, setSortBy] = useState(null);
  // const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  // const location = useLocation();

  const [buttonPosition, setButtonPosition] = useState('top-left');
  const positionRef = useRef('top-left');


  const handleCollectionFilter = (collection) => {
    const newValue = collection === selectedCollection ? null : collection;
    setSelectedCollection(newValue);
    setSortedData(sortData(data, {
      // sortBy,
      // reversed: reverseSortDirection,
      search,
      collectionFilter: newValue
    }));
    setCurrentPage(1);
  };

  useEffect(() => {
    const positions = ['top-left', 'bottom-right', 'top-right', 'bottom-left'];

    const changePosition = () => {
      let next;
      do {
        next = positions[Math.floor(Math.random() * positions.length)];
      } while (next === positionRef.current); // evitar repetir la misma

      setButtonPosition(next);
      positionRef.current = next;
    };

    const interval = setInterval(changePosition, 10000);
    return () => clearInterval(interval);
  }, []);

  const floatingStyle = (position) => {
    const common = {
      position: 'fixed',
      zIndex: 1000,
      animation: 'pulse 1.5s infinite',
    };

    switch (position) {
      case 'top-left':
        return { ...common, top: '60px', left: '20px' };
      case 'bottom-right':
        return { ...common, bottom: '20px', right: '20px' };
      case 'top-right':
        return { ...common, top: '60px', right: '20px' };
      case 'bottom-left':
        return { ...common, bottom: '20px', left: '20px' };
      default:
        return common;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'clanes'));
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


      const fetchCollections = async () => {
        const snapshot = await getDocs(collection(db, 'colections'));
        const docs = snapshot.docs.map(doc => doc.data());
        const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
        setCollections([...new Set(allCollections)]);
      };

      fetchCollections();

      const destacados = groups.filter(g => g.destacado);
      const normales = groups.filter(g => !g.destacado);
      const ordenados = [...destacados, ...normales];

      setData(ordenados);
      setSortedData(ordenados);
    };

    fetchData();
  }, []);


  // const setSorting = (field) => {
  //   const reversed = field === sortBy ? !reverseSortDirection : false;
  //   setReverseSortDirection(reversed);
  //   setSortBy(field);
  //   setSortedData(sortData(data, { sortBy: field, reversed, search }));
  // };

  const handleSearchChange = (event) => {
    const value = event.currentTarget.Telegramvalue;
    setSearch(value);
    setSortedData(sortData(data, { search: value, collectionFilter: selectedCollection }));
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
        
    const iconSrc =
      row.tipo === 'clash-royale'
        ? '/clashRoyaleFondo1.png'     
        : '/clashOfClansFondo.png'; 

    return (
      <Paper
        withBorder
        radius="md"
        shadow="xs"
        mb="sm"
        key={`${row.id}-${slug}-${idx}`}
        onClick={() => router.push(`/clanes/clanes-de-${row.tipo}/${slug}`)}
      >
        <Table horizontalSpacing="md" withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text fw={700}>{row.name}</Text>
          <img
            src={iconSrc}
            alt={row.tipo}
            style={{
              width: isMobile ? 24 : 32,
              height: isMobile ? 24 : 32,
              borderRadius: '50%',
              marginLeft: '10px',
            }}
            // size={isMobile ? 24 : 32}
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

  return (
    <>
      <Head>
        {/* ——— TITLE ——— */}
        <title>Clanes de Videojuegos Activos 2025: Únete o Publica tu Clan Gratis</title>

        {/* ——— DESCRIPTION ——— */}
        <meta
          name="description"
          content="Encuentra y únete a los mejores clanes de videojuegos activos en 2025. Publica tu clan gratis para reclutar miembros y conectar con comunidades de jugadores de Clash Royale y Clash of Clans."
        />

        {/* ——— KEYWORDS (no tan importantes en Google, pero útiles para buscadores menores) ——— */}
        <meta
          name="keywords"
          content="Clanes de Videojuegos, clanes activos, mejores clanes, unirse a clan, publicar clan, comunidades de jugadores, clanes gratis, Clash Royale, Clash of Clans, grupos de juegos, reclutar jugadores, clanes 2025"
        />

        {/* ——— CANONICAL ——— */}
        <link rel="canonical" href="https://joingroups.pro/clanes" />

        {/* ——— OPEN GRAPH ——— */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://joingroups.pro/clanes" />
        <meta property="og:title" content="Clanes de Videojuegos Activos 2025: Únete o Publica tu Clan Gratis" />
        <meta property="og:description" content="Encuentra y únete a los mejores clanes de videojuegos activos. Publica tu clan gratis para reclutar miembros y conectar con la comunidad gamer de Clash Royale y Clash of Clans." />
        <meta property="og:image" content="https://joingroups.pro/JoinGroups.ico" />
        <meta property="og:site_name" content="JoinGroups" />

        {/* ——— TWITTER CARDS ——— */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://joingroups.pro/clanes" />
        <meta name="twitter:title" content="Clanes de Videojuegos Activos 2025: Únete o Publica tu Clan Gratis" />
        <meta name="twitter:description" content="Encuentra y únete a los mejores clanes de videojuegos activos. Publica tu clan gratis para reclutar miembros y conectar con la comunidad gamer de Clash Royale y Clash of Clans." />
        <meta name="twitter:image" content="https://joingroups.pro/JoinGroups.ico" />

        {/* ——— SCHEMA.ORG ——— */}
        <script type="application/ld+json">
          {`
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Clanes de Videojuegos Activos 2025",
            "description": "Explora y únete a los clanes de videojuegos más activos en 2025. Publica tu clan gratis para reclutar jugadores y conectar con comunidades de Clash Royale y Clash of Clans.",
            "url": "https://joingroups.pro/clanes",
            "mainEntity": {
              "@type": "ItemList",
              "name": "Clanes de Clash Royale y Clash of Clans",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item": {
                    "@type": "Thing",
                    "name": "Clanes de Clash Royale",
                    "url": "https://joingroups.pro/clanes/clanes-de-clash-royale",
                    "description": "Encuentra clanes activos de Clash Royale para unirte o publicar el tuyo."
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item": {
                    "@type": "Thing",
                    "name": "Clanes de Clash of Clans",
                    "url": "https://joingroups.pro/clanes/clanes-de-clash-of-clans",
                    "description": "Descubre los mejores clanes de Clash of Clans para guerras y comunidad."
                  }
                }
              ]
            }
          }
          `}
        </script>
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

            {rows.length > 0 ? (
              <>
                <Group gap='xs' mb="md" justify="center">
                  <Button
                    height={140}
                    variant="light"
                    size="xs"
                    radius="md"
                    onClick={() => router.push('/clanes/clanes-de-clash-royale')}
                    leftSection={
                      <img
                        src="/clashRoyaleFondo1.png"
                        alt="Clash Royale"
                        style={{ width: 32, height: 32 }}
                      />
                    }
                  >
                    {t('Clash Royale')}
                  </Button>

                  <Button
                    variant="light"
                    size="xs"
                    radius="md"
                    onClick={() => router.push('/clanes/clanes-de-clash-of-clans')}
                    leftSection={
                      <img
                        src="/clashOfClansFondo.png"
                        alt="Clash of Clans"
                        style={{ width: 34, height: 34 }}
                      />
                    }
                  >
                    {t('Clash of Clans')}
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


                {isMobile ? (
                  <>
                    <Title order={4} mb="xs">
                      📣 {t('¡Promociona tu Clan de VideoJuego en JoinGroups!')}
                    </Title>
                    <Text size="sm" color="dimmed" mb="xs">
                      📱 {t('¿Tienes un clan de videojuego?')} <strong>{t('Publícalo gratis')}</strong> {t('y consigue miembros al instante.')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Title order={3} mb="xs">
                      📣 {t('¡Promociona tu Clan de VideoJuego en JoinGroups!')}
                    </Title>
                    <Text size="sm" color="dimmed" mb="xs">
                      📱 {t('¿Tienes un clan de videojuego y quieres hacerlo crecer?')} <strong>{t('En JoinGroups puedes publicar tu clan gratis')}</strong> {t('y empezar a recibir nuevos miembros interesados.')}<br />
                      🔍 {t('Explora una lista actualizada de')} <strong>{t('clanes de videojuegos')}</strong> {t('organizados por categoría e intereses.')}{' '}
                      🤝 {t('Únete a comunidades activas, comparte tu clan y conéctate con personas afines usando JoinGroups.')}
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
                  {t('¿Quieres que tu Clan de videojuego crezca y llegue a más personas?')}
                </Text>

                <Text size="sm" color="dimmed" mb="xs">
                  {t('Publica tu Clan gratuitamente en')} <Link href="/" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link> {t('y conecta con una comunidad activa que comparte tus intereses. ')}
                  {t('Si aún no sabes cómo crear un clan, puedes aprender fácilmente')} {' '}
                  <Link href="/instrucciones-crear-grupo-telegram" style={{ color: '#228be6', textDecoration: 'underline' }}>
                    {t('aquí cómo crear tu clan de Telegram')}
                  </Link>.
                </Text>

                <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                  {t('Únete a miles de usuarios que ya están haciendo crecer sus clanes en JoinGroups.')}
                </Text>
                </Paper>
              </>
            ) : (
              <Text ta="center" fw={500} c="dimmed" mt="xl">
                {t('No se encontraron resultados.')}
              </Text>
            )}
          {/* Botón flotante con cambio de posición */}
          <Button
            component={Link}
            href="/clanes/publicar-clan"
            color="red"
            size="sm"
            variant='filled'
            radius="xl"
            className={styles['floating-publish-button']}
            style={{
              ...floatingStyle(buttonPosition),
            }}
          >
            Publica tu clan AHORA !!
          </Button>
        </ScrollArea>
      </Container>

    </>
  );
}
