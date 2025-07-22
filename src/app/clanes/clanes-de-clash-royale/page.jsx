'use client';

import { useState, useEffect } from 'react';
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
// import { useLocation } from 'react-router-dom';
import Head from 'next/head';
import styles from '@/app/styles/ClanClashRoyale.module.css';
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
    const matchesSearch = ['name', 'categories' ].some((key) =>
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

export default function ClashRoyale() {
  const { t, i18n } = useTranslation();
const router = useRouter();
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


  const handleCollectionFilter = (collection) => {
    const newValue = collection === selectedCollection ? null : collection;
    setSelectedCollection(newValue);
    setSortedData(sortData(data, {
      search,
      collectionFilter: newValue
    }));
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'clanes'));
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar solo grupos de tipo "clashroyale"
      const clashRoyaleFilter = groups.filter(g => g.tipo === 'clash-royale');

      const fetchCollections = async () => {
        const snapshot = await getDocs(collection(db, 'colections'));
        const docs = snapshot.docs.map(doc => doc.data());
        const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
        setCollections([...new Set(allCollections)]);
      };

      fetchCollections();

      const destacados = clashRoyaleFilter.filter(g => g.destacado);
      const normales = clashRoyaleFilter.filter(g => !g.destacado);
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
        

    return (
      <Paper
        withBorder
        radius="md"
        shadow="xs"
        mb="sm"
        key={`${row.id}-${slug}-${idx}`}
        onClick={() => router.push(`/clanes/clanes-de-clash-royale/${slug}`)}
      >
        <Table horizontalSpacing="md" withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text fw={700}>{row.name}</Text>
          <img
            src='/clashRoyaleFondo1.png' // Assuming this is the logo for Clash Royale
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

  return (
    <>
      <Head>
        {/* --- ETIQUETAS FUNDAMENTALES --- */}
        <title>Clanes de Clash Royale Activos [2025] | Únete o Publica tu Clan</title>
        <meta
          name="description"
          content="La mejor lista de clanes de Clash Royale activos en 2025. Busca clanes por trofeos, únete al que más te guste o publica el tuyo GRATIS para reclutar jugadores."
        />
        <link
          rel="canonical"
          href="https://joingroups.pro/clanes/clanes-de-clash-royale"
        />

        {/* --- OPEN GRAPH --- */}
        <meta
          property="og:title"
          content="Clanes de Clash Royale | Encuentra tu Clan Ideal o Recluta Miembros"
        />
        <meta
          property="og:description"
          content="¿Buscas clan en Clash Royale? Filtra por número de trofeos y encuentra tu equipo perfecto. Si eres líder, publica tu clan y consigue nuevos miembros hoy mismo."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://joingroups.pro/clanes/clanes-de-clash-royale"
        />
        <meta
          property="og:image"
          content="https://joingroups.pro/clashRoyaleFondo1.png"
        />
        <meta
          property="og:image:alt"
          content="El Rey y varios personajes de Clash Royale en la arena de batalla"
        />
        <meta property="og:site_name" content="JoinGroups.pro" />

        {/* --- TWITTER --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Clanes de Clash Royale Activos [2025] | Únete o Recluta Jugadores"
        />
        <meta
          name="twitter:description"
          content="¿Buscas clan en Clash Royale? Filtra por número de trofeos y encuentra tu equipo perfecto. Si eres líder, publica tu clan y consigue nuevos miembros hoy mismo."
        />
        <meta
          name="twitter:image"
          content="https://joingroups.pro/clashRoyaleFondo1.png"
        />
        <meta
          name="twitter:image:alt"
          content="El Rey y varios personajes de Clash Royale en la arena de batalla"
        />

        {/* --- EXTRA --- */}
        <meta
          name="keywords"
          content="clanes clash royale, clanes activos, reclutar jugadores clash royale, unirse a clan, buscar clan clash royale, publicar clan gratis, guerra de clanes, clanes cr español"
        />
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

          {rows.length > 0 ? (
            <>
              <Group gap='xs' mb="md" justify="center">
                <Button
                  variant="light"
                  size="xs"
                  radius="md"
                  onClick={() => router.push('/clanes')}
                  leftSection={
                    <img
                      src="/telegramicons.png"
                      alt="Telegram"
                      style={{ width: 16, height: 16 }}
                    />
                  }
                >
                  {t('Todos los Clanes')}
                </Button>
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
                    📣 {t('¡Promociona tu Clan de Clash Royale en JoinGroups!')}
                  </Title>
                  <Text size="sm" color="dimmed" mb="xs">
                    📱 {t('¿Tienes un clan de Clash Royale?')} <strong>{t('Publícalo gratis')}</strong> {t('y consigue miembros al instante.')}
                  </Text>
                </>
              ) : (
                <>
                  <Title order={3} mb="xs">
                    📣 {t('¡Promociona tu Clan de Clash Royale en JoinGroups!')}
                  </Title>
                  <Text size="sm" color="dimmed" mb="xs">
                    📱 {t('¿Tienes un clan de Clash Royale y quieres hacerlo crecer?')} <strong>{t('En JoinGroups puedes publicar tu clan gratis')}</strong> {t('y empezar a recibir nuevos miembros interesados.')}<br />
                    🔍 {t('Explora una lista actualizada de')} <strong>{t('clanes de Clash Royale')}</strong> {t('organizados por categoría e intereses.')}{' '}
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
                {t('¿Quieres que tu clan de Clash Royale crezca y llegue a más personas?')}
              </Text>

              <Text size="sm" color="dimmed" mb="xs">
                {t('Publica tu CLAN gratuitamente en')} <Link href="/clanes/form" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link> {t('y conecta con una comunidad activa que comparte tus intereses.')}
                {t('Si aún no sabes cómo crear un clan, puedes aprender fácilmente')} {' '}
                <Link href="/instrucciones-crear-grupo-telegram" style={{ color: '#228be6', textDecoration: 'underline' }}>
                  {t('aquí cómo crear tu clan de Clash Royale')}
                </Link>.
              </Text>

              <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                {t('Únete a miles de usuarios que ya están haciendo crecer sus clanes de Clash Royale.')}
              </Text>
              </Paper>
            </>
          ) : (
            <Text ta="center" fw={500} c="dimmed" mt="xl">
              {t('No se encontraron resultados.')}
            </Text>
          )}
        </ScrollArea>
      </Container> 

    </>
  );
}
