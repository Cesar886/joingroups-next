'use client'; // ¡Esto es crucial! Marca este componente como cliente.

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
  SimpleGrid,
  ScrollArea,
  Badge,
  Table,
  Accordion, 
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

const placeholder =
  'It can’t help but hear a pin drop from over half a mile away, so it lives deep in the mountains where there aren’t many people or Pokémon.It was born from sludge on the ocean floor. In a sterile environment, the germs within its body can’t multiply, and it dies.It has no eyeballs, so it can’t see. It checks its surroundings via the ultrasonic waves it emits from its mouth.';




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

export default function ClashRoyaleClient({ serverData }) {
  const [data, setData] = useState(serverData || []);
  const [sortedData, setSortedData] = useState(serverData || []);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
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

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const snapshot = await getDocs(collection(db, 'clanes'));
  //     const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  //     // Filtrar solo grupos de tipo "clashroyale"
  //     const clashRoyaleFilter = groups.filter(g => g.tipo === 'clash-royale');

  //     const fetchCollections = async () => {
  //       const snapshot = await getDocs(collection(db, 'colections'));
  //       const docs = snapshot.docs.map(doc => doc.data());
  //       const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
  //       setCollections([...new Set(allCollections)]);
  //     };

  //     fetchCollections();

  //     const destacados = clashRoyaleFilter.filter(g => g.destacado);
  //     const normales = clashRoyaleFilter.filter(g => !g.destacado);
  //     const ordenados = [...destacados, ...normales];

  //     setData(ordenados);
  //     setSortedData(ordenados);
  //   };

  //   fetchData();
  // }, []);


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
      <Container size="lg" px="md" py="xl">
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
                      Clanes activos de Clash Royale en 2025
                    </Title>
                    <Text size="sm" color="dimmed" mb="xs">
                      ¿Buscas un <strong>clan competitivo en Clash Royale</strong>? En <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a> puedes encontrar los <strong>mejores clanes activos del 2025</strong>. <br />
                      Descubre <strong>cómo unirte a los mejores clanes</strong>, quiénes están en el <strong>top global</strong> y cómo mejorar tu experiencia con <strong>decks recomendados</strong> y guías. <br />
                      Todo en un solo lugar para que subas copas, ganes guerras y conectes con jugadores reales.
                    </Text>
                  </>
                ) : (
                  <>
                    <Title order={3} mb="xs">
                      Encuentra clanes de Clash Royale competitivos y activos (2025)
                    </Title>
                    <Text size="sm" color="dimmed" mb="xs">
                      ¿Quieres unirte al <strong>mejor clan de Clash Royale</strong>? En <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a> reunimos clanes activos, filtrados por copas, idioma y estilo de juego. <br />
                      Aprende <strong>qué es un clan</strong>, cómo encontrar uno ideal, o incluso <strong>cómo crear y publicar tu propio clan</strong> en minutos. <br />
                      También respondemos dudas frecuentes como: ¿<strong>Quién es el líder del mejor clan?</strong> ¿<strong>Clash Royale o Clash of Clans</strong>? <br />
                      Todo lo que necesitas para destacar en 2025: <strong>clanes actualizados</strong>, <strong>estrategias</strong> y <strong>guías exclusivas</strong>.
                    </Text>
                  </>
                )}
              </Paper>

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
              
              <Container size="lg" className={styles.wrapper}>
                <Title ta="center" order={2} className={styles.title}>
                  Preguntas frecuentes
                </Title>

                <Accordion variant="contained" radius="md">
                  <Accordion.Item className={styles.item} value="que-es-clan">
                    <Accordion.Control>¿Qué es un clan en Clash Royale?</Accordion.Control>
                    <Accordion.Panel>
                      Un clan en Clash Royale es un grupo de jugadores...
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="donde-encontrar">
                    <Accordion.Control>¿Dónde encontrar clanes activos de Clash Royale?</Accordion.Control>
                    <Accordion.Panel>
                      Puedes buscarlos en <Link href="/clanes" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="mejor-clan">
                    <Accordion.Control>¿Cuál es el mejor clan de Clash Royale?</Accordion.Control>
                    <Accordion.Panel>
                      No hay un único mejor clan, pero puedes ver los destacados...
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="publicar">
                    <Accordion.Control>¿Cómo publicar mi clan de Clash Royale?</Accordion.Control>
                    <Accordion.Panel>
                      Ve a <Link href="/clanes/form" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="unirse">
                    <Accordion.Control>¿Cómo unirse a un buen clan?</Accordion.Control>
                    <Accordion.Panel>
                      Busca clanes activos y con buen historial.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="ventajas">
                    <Accordion.Control>¿Qué ventajas tiene publicar mi clan?</Accordion.Control>
                    <Accordion.Panel>
                      Reclutas más miembros y creces más rápido.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="buscar">
                    <Accordion.Control>¿Cómo buscar un clan?</Accordion.Control>
                    <Accordion.Panel>
                      Usa el buscador del juego o visita <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a>.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="crear">
                    <Accordion.Control>¿Cómo crear un clan?</Accordion.Control>
                    <Accordion.Panel>
                      Desde el juego, en la pestaña de clanes, puedes crear uno.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="top1">
                    <Accordion.Control>¿Cuál es el clan top 1?</Accordion.Control>
                    <Accordion.Panel>
                      Cambia constantemente, puedes verlo en JoinGroups.
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item className={styles.item} value="mejor-juego">
                    <Accordion.Control>¿Qué es mejor: Clash Royale o Clash of Clans?</Accordion.Control>
                    <Accordion.Panel>
                      Clash Royale es para partidas rápidas, Clash of Clans para estrategia.
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </Container>

              <Paper
                withBorder
                radius="md"
                shadow="xs"
                mt="xl"
                p="md"
                style={{ backgroundColor: '#f9f9f9', marginBottom: '20px', paddingBottom: '10px' }}
              >
              <Text size="md" fw={600} mb="sm">
                ¿Buscas clanes activos de Clash Royale en 2025? ¡Únete o crea el tuyo en <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a>!
              </Text>

              <Text size="sm" color="dimmed" mb="xs">
                ¿<strong>Clash Royale tiene clanes</strong>? Claro, es la comunidad donde los jugadores compiten, donan cartas y ganan recompensas. <br />
                ¿<strong>Cómo unirse a un buen clan de Clash Royale</strong>? Usa nuestro <Link href="/clanes/form" style={{ color: '#228be6', textDecoration: 'underline' }}>buscador de clanes</Link> para encontrar el clan ideal según tu estilo y nivel. <br />
                ¿<strong>Cuál es el mejor clan</strong>? ¿<strong>Quién es el líder</strong>? Aquí te mostramos los <strong>clanes más activos y mejor rankeados</strong>. <br />
                También descubre <strong>quién es el top 1 de Clash Royale</strong> o <strong>cómo encontrar tu antiguo clan</strong>. <br />
                Si aún no tienes clan, aprende fácil <Link href="/instrucciones-crear-grupo-telegram" style={{ color: '#228be6', textDecoration: 'underline' }}>cómo crear tu propio clan</Link> paso a paso.
              </Text>

              <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                Miles de jugadores ya usan <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a> para encontrar o publicar sus clanes de Clash Royale. ¡Únete y mejora tu juego hoy!
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

export async function getServerSideProps() {
  // Esta lógica ahora se ejecuta en el servidor
  const snapshot = await getDocs(collection(db, 'clanes'));
  const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filtrar solo grupos de tipo "clash-royale"
  const clashRoyaleFilter = groups.filter(g => g.tipo === 'clash-royale');

  const destacados = clashRoyaleFilter.filter(g => g.destacado);
  const normales = clashRoyaleFilter.filter(g => !g.destacado);
  const ordenados = [...destacados, ...normales];

  // Pasamos los datos a la página a través de props
  return {
    props: {
      initialData: ordenados, // Enviamos los datos como 'initialData'
    },
  };
}