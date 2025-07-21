import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { db } from '../firebase';
import { useMediaQuery } from '@mantine/hooks';
import slugify from '../assets/slugify';
import { Helmet } from 'react-helmet-async';
import styles from './ClanClashRoyale.module.css';


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

export default function ClashOfClans() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);


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
      const clashOfClans = groups.filter(g => g.tipo === 'clash-of-clans');

      const fetchCollections = async () => {
        const snapshot = await getDocs(collection(db, 'colections'));
        const docs = snapshot.docs.map(doc => doc.data());
        const allCollections = docs.flatMap(doc => Array.isArray(doc.colections) ? doc.colections : []);
        setCollections([...new Set(allCollections)]);
      };

      fetchCollections();

      const destacados = clashOfClans.filter(g => g.destacado);
      const normales = clashOfClans.filter(g => !g.destacado);
      const ordenados = [...destacados, ...normales];

      setData(ordenados);
      setSortedData(ordenados);
    };

    fetchData();
  }, []);


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
        onClick={() => navigate(`/clanes/clanes-de-clash-of-clans/${slug}`)}
      >
        <Table horizontalSpacing="md" withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text fw={700}>{row.name}</Text>
          <img
            src="/clashOfClansFondo.png" // Assuming this is the logo for Clash of Clans
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
      <Helmet>
      {/* ——— TITLE ——— */}
      <title>Clanes de Clash of Clans Activos 2025: Únete o Publica tu Clan Gratis</title>

      {/* ——— DESCRIPTION ——— */}
      <meta
        name="description"
        content="Encuentra y únete a los mejores clanes de Clash of Clans activos en 2025. Publica tu clan gratis para reclutar nuevos miembros y dominar las guerras de clanes. ¡Estrategia, construcción y comunidad!"
      />

      {/* ——— KEYWORDS (No tan importantes para Google, pero pueden ser útiles para otros buscadores y para entender el contexto) ——— */}
      <meta
        name="keywords"
        content="Clanes Clash of Clans, clanes activos Clash of Clans, mejores clanes Clash of Clans, unirse a clan Clash of Clans, publicar clan Clash of Clans, Clash of Clans 2025, comunidad Clash of Clans, clanes gratis Clash of Clans, reclutar Clash of Clans, guerras de clanes, estrategia Clash of Clans"
      />

      {/* ——— CANONICAL ——— */}
      <link rel="canonical" href="https://joingroups.pro/clanes/clanes-de-clash-of-clans" />

      {/* ——— OPEN GRAPH (Para compartir en redes sociales como Facebook ) ——— */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://joingroups.pro/clanes/clanes-de-clash-of-clans" />
      <meta property="og:title" content="Clanes de Clash of Clans Activos 2025: Únete o Publica tu Clan Gratis" />
      <meta property="og:description" content="Encuentra y únete a los mejores clanes de Clash of Clans activos en 2025. Publica tu clan gratis para reclutar nuevos miembros y dominar las guerras de clanes." />
      <meta property="og:image" content="https://joingroups.pro/JoinGroups.ico" />
      <meta property="og:site_name" content="JoinGroups" />

      {/* ——— TWITTER CARDS (Para compartir en Twitter ) ——— */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://joingroups.pro/clanes/clanes-de-clash-of-clans" />
      <meta name="twitter:title" content="Clanes de Clash of Clans Activos 2025: Únete o Publica tu Clan Gratis" />
      <meta name="twitter:description" content="Encuentra y únete a los mejores clanes de Clash of Clans activos en 2025. Publica tu clan gratis para reclutar nuevos miembros y dominar las guerras de clanes." />
      <meta name="twitter:image" content="https://joingroups.pro/JoinGroups.ico" />

      {/* ——— SCHEMA.ORG (Datos estructurados para mejorar la visibilidad en los resultados de búsqueda ) ——— */}
      <script type="application/ld+json">
        {`
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Clanes de Clash of Clans Activos 2025",
          "description": "Explora y únete a los clanes de Clash of Clans más activos en 2025: estrategia, construcción, guerras de clanes y comunidad. Publica tu clan gratis para reclutar.",
          "url": "https://joingroups.pro/clanes/clanes-de-clash-of-clans",
          "mainEntity": {
            "@type": "ItemList",
            "name": "Clanes de Clash of Clans",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Thing",
                  "name": "Clanes de Clash of Clans Activos",
                  "description": "Clanes de Clash of Clans con alta actividad en guerras y juegos de clan."
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "Thing",
                  "name": "Clanes de Clash of Clans para Guerras",
                  "description": "Clanes de Clash of Clans enfocados en la estrategia y victorias en guerras."
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "Thing",
                  "name": "Publicar Clan de Clash of Clans",
                  "description": "Plataforma para que los líderes de clanes de Clash of Clans publiquen sus clanes y recluten miembros."
                }
              }
            ]
          }
        }
        `}
      </script>
    </Helmet>


      <ScrollArea>
        {selectedCollection && (
          <Button
            variant="outline"
            color="gray"
            mb="xs"
            onClick={() => handleCollectionFilter(selectedCollection)}
          >
            {t('Quitar filtro')}: {selectedCollection}
          </Button>
        )}

        <TextInput
          placeholder={t('Buscar por nombre, categoría o contenido...')}
          mb="md"
          leftSection={<IconSearch size={16} stroke={1.5} />}
          value={search}
          onChange={handleSearchChange}
        />

        {collections.length > 0 && (
          <Group mb="md" spacing="xs" wrap="wrap">
            <Badge
              key="todos"
              variant={selectedCollection === null ? 'filled' : 'light'}
              color={selectedCollection === null ? 'blue' : 'gray'}
              size="md"
              onClick={() => handleCollectionFilter(null)}
              style={{ cursor: 'pointer' }}
            >
              {t('Todos')}
            </Badge>

            {collections.map((col) => (
              <Badge
                key={col}
                variant={selectedCollection === col ? 'filled' : 'light'}
                color={selectedCollection === col ? 'blue' : 'gray'}
                size="md"
                onClick={() => handleCollectionFilter(col)}
                style={{ cursor: 'pointer' }}
              >
                {col}
              </Badge>
            ))}
          </Group>
        )}

        {rows.length > 0 ? (
          <>
            <Group gap='xs' mb="md" justify="center">
              <Button
                variant="light"
                size="xs"
                radius="md"
                onClick={() => navigate('/clanes')}
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
                onClick={() => navigate('/clanes/clanes-de-clash-royale')}
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
                onClick={() => navigate('/clanes/clanes-de-clash-of-clans')}
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
              <Title order={2} mb="sm" className={styles.GruposDeTelegram}>
                Grupos de Telegram ⟶ Enlaces Directos para Unirte (Por Temática)
              </Title>

              <div className={styles.GruposDeTelegram}>
              <h2>Clanes de Clash of Clans: Descubre y Únete a Comunidades Activas</h2>
              <p>
                Los <strong>Clanes de Clash of Clans</strong> se han convertido en una de las formas más populares de conectarse con personas que comparten tus intereses. Desde tecnología hasta entretenimiento, existen miles de comunidades esperando nuevos miembros. Si estás buscando una forma de expandir tus redes o simplemente pasar un buen rato, unirte a clanes de Clash of Clans puede ser la opción ideal.
              </p>

              <h3>Unirse a Clanes de Clash of Clans Nunca Fue Tan Fácil</h3>
              <p>
                Hoy en día, <strong>unirse a clanes de Clash of Clans</strong> es un proceso rápido y sencillo. A través de plataformas como JoinGroups, puedes explorar una gran variedad de comunidades activas, organizadas por categorías, intereses y temáticas. Ya no necesitas buscar por horas; aquí encuentras lo que te gusta en segundos.
              </p>

              <h3>Enlaces de Clanes de Clash of Clans Verificados y Activos</h3>
              <p>
                Uno de los mayores desafíos es encontrar <strong>enlaces de clanes de Clash of Clans</strong> que realmente funcionen y estén activos. En nuestro sitio recopilamos los mejores enlaces verificados, para que no pierdas tiempo con enlaces rotos o grupos abandonados. Todo está organizado para que accedas directamente a las comunidades más relevantes.
              </p>

              <h3>Buscar Clanes de Clash of Clans por Temática e Intereses</h3>
              <p>
                Si quieres <strong>buscar clanes de Clash of Clans</strong> específicos, puedes usar nuestro sistema de filtros por categoría. ¿Te gusta el anime? ¿Estás interesado en criptomonedas? ¿Quieres unirte a grupos de estudio? Aquí puedes encontrar exactamente lo que buscas de forma fácil y sin complicaciones.
              </p>

              <h3>Clanes Públicos de Clash of Clans para Todos</h3>
              <p>
                Los <strong>clanes públicos de Clash of Clans</strong> permiten que cualquier persona pueda unirse sin necesidad de una invitación privada. Esta apertura es ideal para quienes buscan ampliar sus horizontes, hacer networking, o simplemente conocer gente nueva. Nuestra plataforma te ayuda a descubrir estos grupos y unirte con un solo clic.
              </p>

              <h3>Los Mejores Clanes de Clash of Clans en un Solo Lugar</h3>
              <p>
                ¿Quieres estar en los más populares? Hemos recopilado una selección con los <strong>Mejores Clanes de Clash of Clans</strong>, basada en actividad, número de usuarios y relevancia. No te conformes con cualquier grupo; accede directamente a los más destacados del momento.
              </p>

              <p>
                En JoinGroups, nuestro objetivo es ayudarte a encontrar, compartir y unirte a las mejores clanes de Clash of Clans. Desde los <strong>clanes públicos</strong> más populares hasta aquellos más especializados, aquí tienes todo lo que necesitas para empezar.
              </p>

              <h2>Cómo Hacer Crecer un Clan de Clash of Clans en 2025: Guía para Admins</h2>
              <p>
                Si te preguntas <strong>cómo hacer crecer mi clan de Clash of Clans</strong>, estás en el lugar indicado. Hacer crecer una comunidad de Clash of Clans requiere estrategia, paciencia y las herramientas adecuadas. A continuación, te ofrecemos los mejores consejos para aumentar la participación, atraer nuevos miembros y asegurar que tu clan se mantenga activo y atractivo.
              </p>

              <h3>Promocionar mi Clan de Clash of Clans en Canales Relacionados</h3>
              <p>
                Una estrategia eficaz para <strong>hacer crecer tu clan</strong> es promoverlo en otros <strong>canales de Telegram</strong> relacionados. Puedes colaborar con administradores de otros grupos similares para intercambiar menciones o invitaciones. Esto ayuda a atraer miembros interesados en el mismo tipo de contenido.
              </p>

              <h3>¿Cómo encontrar los mejores clanes de Clash of Clans?</h3>
              <p>Para encontrar los mejores clanes de Clash of Clans, usa plataformas que verifiquen los enlaces, como JoinGroups. Filtra por categoría o interés y evita enlaces rotos.</p>

            </div>


            {isMobile ? (
              <>
                <Title order={4} mb="xs">
                  📣 {t('¡Promociona tu Clan de Clash of Clans en JoinGroups!')}
                </Title>
                <Text size="sm" color="dimmed" mb="xs">
                  📱 {t('¿Tienes un clan de Clash of Clans?')} <strong>{t('Publícalo gratis')}</strong> {t('y consigue miembros al instante.')}
                </Text>
              </>
            ) : (
              <>
                <Title order={3} mb="xs">
                  📣 {t('¡Promociona tu Clan de Clash of Clans en JoinGroups!')}
                </Title>
                <Text size="sm" color="dimmed" mb="xs">
                  📱 {t('¿Tienes un clan de Clash of Clans y quieres hacerlo crecer?')} <strong>{t('En JoinGroups puedes publicar tu clan gratis')}</strong> {t('y empezar a recibir nuevos miembros interesados.')}<br />
                  🔍 {t('Explora una lista actualizada de')} <strong>{t('clanes de Clash of Clans')}</strong> {t('organizados por categoría e intereses.')}{' '}
                  🤝 {t('Únete a comunidades activas, comparte tu clan y conéctate con personas afines usando JoinGroups.')}
                </Text>
              </>
            )}
            </Paper>

            <Group>
              <Button
                variant="outline"
                size="xs"
                radius="md"
                onClick={() => navigate('/clanes/form')}
                leftSection={
                  <img
                  src="/telegramicons.png"
                  alt="Telegram"
                  style={{ width: 16, height: 16 }}
                  />
                }
                >
                {t('Publica tu clan AQUI')}
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

            <Paper
              withBorder
              radius="md"
              shadow="xs"
              mt="xl"
              p="md"
              style={{ backgroundColor: '#f9f9f9', marginBottom: '20px', paddingBottom: '10px' }}
            >
            <Text size="md" fw={600} mb="sm">
              {t('¿Quieres que tu clan de Clash of Clans crezca y llegue a más personas?')}
            </Text>

            <Text size="sm" color="dimmed" mb="xs">
              {t('Publica tu CLAN gratuitamente en')} <Link to="/clanes/form" style={{ color: '#228be6', textDecoration: 'underline' }}>JoinGroups</Link> {t('y conecta con una comunidad activa que comparte tus intereses.')}
              {t('Si aún no sabes cómo crear un clan, puedes aprender fácilmente')} {' '}
              <Link to="/instrucciones-crear-clan" style={{ color: '#228be6', textDecoration: 'underline' }}>
                {t('aquí cómo crear tu clan de Clash of Clans')}
              </Link>.
            </Text>

            <Text size="xs" color="dimmed" style={{ fontStyle: 'italic' }}>
              {t('Únete a miles de usuarios que ya están haciendo crecer sus comunidades en Telegram.')}
            </Text>
            </Paper>
          </>
        ) : (
          <Text ta="center" fw={500} c="dimmed" mt="xl">
            {t('No se encontraron resultados.')}
          </Text>
        )}
      </ScrollArea>
    </>
  );
}
