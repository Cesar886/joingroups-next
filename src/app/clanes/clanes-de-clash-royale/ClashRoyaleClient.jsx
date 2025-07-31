'use client';

import { useState, useEffect, useRef } from 'react';
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
  Container,
  Paper,
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
import styles from '@/app/styles/ClanClashRoyale.module.css';
import { useRouter } from 'next/navigation';


import { useTranslation } from 'react-i18next';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gosukbdahdvsade.site';


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

export default function ClashRoyaleClient({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [sortedData, setSortedData] = useState(initialData || []);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [clan, setClan] = useState(null);
  const [clanDetails, setClanDetails] = useState({});

  const [buttonPosition, setButtonPosition] = useState('top-left');
  const positionRef = useRef('top-left');
  
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
    const fetchClan = async () => {
      const rawTag = data?.[0]?.tag;

      const normalizeTag = (rawTag) => {
        if (rawTag?.startsWith('#')) {
          return `%23${rawTag.slice(1)}`;
        }
        return rawTag;
      };

      const tag = normalizeTag(rawTag);

      try {
        const response = await fetch(`${API_URL}/api/clash?tag=${tag}&type=full`);
        const result = await response.json();
        console.log("🚀 ~ fetchClan ~ result:", result)
        setClan(result);
      } catch (error) {
        console.error('Error al obtener información del clan:', error);
      }
    };

    if (data?.length) {
      fetchClan();
    }
  }, [data]);

  useEffect(() => {
    const fetchAllClanDetails = async () => {
      const details = {};

      for (const row of data) {
        const tag = row.tag.replace('#', '%23');
        try {
          const res = await fetch(`${API_URL}/api/clash?tag=${tag}&type=full`);
          const json = await res.json();
          details[row.tag] = json;
        } catch (e) {
          console.error(`Error fetching clan ${row.tag}`, e);
        }
      }

      setClanDetails(details);
    };

    if (data.length) {
      fetchAllClanDetails();
    }
  }, [data]);


  const handleSearchChange = (event) => {
    const value = event.currentTarget.value;
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


    const safeNumber = (num) => typeof num === 'number' ? num.toLocaleString() : 'N/A';
    const clanInfo = clanDetails[row.tag]?.info;
        

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
                <div>
                  <Text fw={700}>{(clanInfo?.name ?? row.name)}</Text>
                </div>
                <img
                  src='/clashRoyaleFondo1.png'
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


          {/* CATEGORÍA - CONTENIDO - VISTAS */}
          <Table.Tr>
            <Table.Td width="28%">
              <Text>{t(row.categories)}</Text>
              <Text size="xs" c="dimmed">{t('Categoría')}</Text>
            </Table.Td>
            <Table.Td width="28%">
              <Text>{safeNumber(clanInfo?.members ?? row.members)}/50</Text>
              <Text size="xs" c="dimmed">{t('Miembros')}</Text>
            </Table.Td>
            <Table.Td width="28%">
              <Text>{safeNumber(clanInfo?.requiredTrophies ?? row.requiredTrophies)}</Text>
              <Text size="xs" c="dimmed">{t('Minimo de Trofeos')}</Text>
            </Table.Td>
            <Table.Td width="28%">
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
                  <h1 order={4} mb="xs">
                    {t('Clanes de Clash Royale')}
                  </h1>
                  <Text size="sm" color="dimmed" mb="xs">
                    {t('mobile1')} <strong>{t('mobile2')}</strong>? {t('mobile3')}{' '}
                    <a
                      href="https://www.joingroups.pro/clanes/clanes-de-clash-royale"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#228be6', textDecoration: 'underline' }}
                    >
                      JoinGroups
                    </a>{' '}
                    {t('mobile4')} <strong>{t('mobile5')}</strong>. <br />
                    {t('mobile6')} <strong>{t('mobile7')}</strong>, {t('mobile8')}{' '}
                    <strong>{t('mobile9')}</strong> {t('mobile10')} <strong>{t('mobile11')}</strong>{' '}
                    {t('mobile12')} <br />
                    {t('mobile13')}
                  </Text>
                </>
              ) : (
                <>
                  <h1 order={3} mb="xs">
                    {t('Clanes de Clash Royale ⚔️ | Únete, Busca o Recluta Jugadores')}
                  </h1>
                  <Text size="sm" color="dimmed" mb="xs">
                    {t('¡Bienvenido a JoinGroups, tu destino definitivo para todo lo relacionado con los clanes de Clash Royale!')} {t('Si estás buscando')} <strong>{t('unirte a un clan de Clash Royale')}</strong> {t('que se adapte perfectamente a tu estilo de juego, o si eres un líder de clan que necesita')} <strong>{t('reclutar jugadores activos')}</strong> {t('para dominar la arena, has llegado al lugar indicado.')} {t('En nuestra plataforma, te facilitamos la búsqueda de los')} <strong>{t('mejores clanes de Clash Royale')}</strong> {t('para 2025, filtrados por trofeos, idioma y nivel de actividad, incluyendo una amplia selección de')} <strong>{t('clanes en español')}</strong>.
                    <br />
                    {t('Aquí no solo encontrarás un')} <strong>{t('clan activo')}</strong> {t('para tus batallas y')} <strong>{t('guerras de clanes')}</strong>, {t('sino que también te ofrecemos guías completas sobre cómo encontrar el clan ideal, cómo')} <strong>{t('publicar tu clan gratis')}</strong> {t('para atraer nuevos miembros, y todo lo que necesitas saber para destacar en el competitivo mundo de Clash Royale.')} <br />
                    {t('¡Prepárate para llevar tu juego al siguiente nivel con el clan perfecto!')}
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
                      {t('mobile0.acordion.clashroyale.titulo')}
                    </Title>

                    <Accordion variant="contained" radius="md">
                      <Accordion.Item className={styles.item} value="que-es-clan">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p1.q')}</Accordion.Control>
                        <Accordion.Panel>{t('mobile0.acordion.clashroyale.p1.a')}</Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="donde-encontrar">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p2.q')}</Accordion.Control>
                        <Accordion.Panel>
                          {t('mobile0.acordion.clashroyale.p2.a.1')} <Link href="/clanes" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>{' '}
                          {t('mobile0.acordion.clashroyale.p2.a.2')}
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="mejor-clan">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p3.q')}</Accordion.Control>
                        <Accordion.Panel>
                          {t('mobile0.acordion.clashroyale.p3.a.1')} <Link href="/clanes" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>{' '}
                          {t('mobile0.acordion.clashroyale.p3.a.2')}
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="publicar">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p4.q')}</Accordion.Control>
                        <Accordion.Panel>
                          {t('mobile0.acordion.clashroyale.p4.a.1')} <Link href="/clanes/publicar-clan" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>{' '}
                          {t('mobile0.acordion.clashroyale.p4.a.2')}
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="unirse">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p5.q')}</Accordion.Control>
                        <Accordion.Panel>{t('mobile0.acordion.clashroyale.p5.a')}</Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="ventajas">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p6.q')}</Accordion.Control>
                        <Accordion.Panel>{t('mobile0.acordion.clashroyale.p6.a')}</Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="buscar">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p7.q')}</Accordion.Control>
                        <Accordion.Panel>
                          {t('mobile0.acordion.clashroyale.p7.a.1')} <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a>{' '}
                          {t('mobile0.acordion.clashroyale.p7.a.2')}
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="crear">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p8.q')}</Accordion.Control>
                        <Accordion.Panel>{t('mobile0.acordion.clashroyale.p8.a')}</Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="top1">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p9.q')}</Accordion.Control>
                        <Accordion.Panel>
                          {t('mobile0.acordion.clashroyale.p9.a.1')} <Link href="/clanes" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link>.
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item className={styles.item} value="mejor-juego">
                        <Accordion.Control>{t('mobile0.acordion.clashroyale.p10.q')}</Accordion.Control>
                        <Accordion.Panel>{t('mobile0.acordion.clashroyale.p10.a')}</Accordion.Panel>
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
            <h2 size="md" fw={600} mb="sm">
                {t('¿Buscas los mejores clanes de Clash Royale para unirte o reclutar? ¡Tu comunidad te espera en ')} <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a>!
              </h2>

              <Text size="sm" color="dimmed" mb="xs">
                {t('clashRoyale.faq1')} {t('Los clanes son el corazón de Clash Royale, la comunidad perfecta para competir, donar cartas y obtener recompensas exclusivas.')} <br />
                {t('clashRoyale.faq2')} {t('Encuentra tu clan ideal de Clash Royale utilizando nuestro avanzado buscador de clanes, filtrado por trofeos, actividad y más.')} <Link href="/clanes/publicar-clan" style={{ color: '#228be6', textDecoration: 'underline' }}>{t('clashRoyale.linkSearch')}</Link> <br />
                {t('clashRoyale.faq3')} {t('Descubre los clanes de Clash Royale más activos y mejor rankeados, y conoce a los líderes que los llevan a la victoria.')} <br />
                {t('clashRoyale.faq4')} {t('Además, aprende cómo encontrar tu antiguo clan de Clash Royale o quién es el top 1 global para inspirarte.')} <br />
                {t('clashRoyale.faq5')} {t('Si eres líder, te enseñamos cómo crear y publicar tu clan de Clash Royale gratis para atraer a jugadores comprometidos.')} <Link href="/instrucciones-crear-grupo-telegram" style={{ color: '#228be6', textDecoration: 'underline' }}>{t('clashRoyale.linkCreate')}</Link>.
              </Text>

              <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
                {t('clashRoyale.cta')} {t('Miles de jugadores y líderes ya confían en JoinGroups para encontrar y gestionar sus clanes de Clash Royale. ¡Únete a la comunidad y mejora tu experiencia de juego hoy mismo en')} <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale" target="_blank" rel="noopener noreferrer" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</a>.
              </Text>
              </Paper>
            </>
          ) : (
            <Text ta="center" fw={500} c="dimmed" mt="xl">
              {t('No se encontraron resultados.')}
            </Text>
          )}
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
            {t('Publica tu clan AHORA !!')}
          </Button>
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