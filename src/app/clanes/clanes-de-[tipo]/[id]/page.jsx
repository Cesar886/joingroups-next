// app/GroupDetailClanes.jsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  doc, increment, limit, runTransaction, updateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useParams } from 'next/navigation';
import {
  Box, Button, Center, Container, Divider,
  Group, Paper, Stack, Text, Title, Card, Badge, Image, SimpleGrid, rem, Grid,   Modal,
  ScrollArea,
  Table, useMantineTheme, Avatar,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks'; // Hook for modal state management
import slugify from '@/lib/slugify';
import { useTranslation } from 'react-i18next';
import classes from '@/app/styles/DetailsClans.module.css'; // Your existing CSS module

// Import all the icons you'll use directly in this file
import {
  IconTrophy, IconGift, IconShield, IconMapPin, IconTarget, IconCornerLeftDown
} from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gosukbdahdvsade.site';


export default function GroupDetailClanes() {
  const { t, i18n } = useTranslation();
  const { id, tipo } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clan, setClan] = useState(null);
  const [clanData, setClanData] = useState(null); // Can keep this if needed for other parts of 'result'
  const [opened, { open, close }] = useDisclosure(false); // State for modal

  const theme = useMantineTheme(); 

  useEffect(() => {
    
    const fetchGroup = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const q = query(
          collection(db, 'clanes'),
          where('slug', '==', id),
          limit(1)
        );
        let snap = await getDocs(q);

        if (snap.empty) {
          const allQ = query(collection(db, 'clanes'), limit(1000));
          const allSnap = await getDocs(allQ);
          snap = allSnap.docs.filter(d => slugify(d.data().name) === id);
        } else {
          snap = snap.docs;
        }

        if (snap.length === 0) {
          setNotFound(true);
          return;
        }

        const docSnap = snap[0];
        const docRef = docSnap.ref;
        const data = docSnap.data();

        if (!data.slug) {
          await updateDoc(docRef, { slug: slugify(data.name) });
        }

        const visitKey = `visitado-${id}`;
        const yaVisitado = sessionStorage.getItem(visitKey);

        if (!yaVisitado) {
          await runTransaction(db, async (trx) => {
            const fresh = await trx.get(docRef);
            const v = fresh.data()?.visitas || 0;
            trx.update(docRef, { visitas: v + 1 });
          });
          sessionStorage.setItem(visitKey, 'true');
        }

        setGroup({ id: docSnap.id, ...data, slug: data.slug || slugify(data.name) });

      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  useEffect(() => {
    const fetchClan = async () => {
      const rawTag = group?.tag;
      if (!rawTag) return;

      const normalizeTag = (rawTag) => {
        return rawTag.startsWith('#') ? `%23${rawTag.slice(1)}` : rawTag;
      };

      const tag = normalizeTag(rawTag);

      try {
        const response = await fetch(`${API_URL}/api/clash?tag=${tag}&type=full`);
        const result = await response.json();
        setClan(result.info); // Assuming result.info contains the detailed clan data
        setClanData(result);
      } catch (error) {
        console.error('Error al obtener información del clan:', error);
      }
    };

    if (group) {
      fetchClan();
    }
  }, [group]);

  const formatLastSeen = (isoDateString) => {
    if (!isoDateString) return 'N/A';
    try {
      // The given format is 'YYYYMMDDTHHMMSS.000Z'
      // Convert to a more standard ISO format for Date object
      const year = isoDateString.substring(0, 4);
      const month = isoDateString.substring(4, 6);
      const day = isoDateString.substring(6, 8);
      const time = isoDateString.substring(9, 17); // HHMMSS

      const formattedDateString = `${year}-${month}-${day}T${time.substring(0,2)}:${time.substring(2,4)}:${time.substring(4,6)}.000Z`;

      const date = new Date(formattedDateString);
      if (isNaN(date)) {
        console.error("Invalid date string:", isoDateString);
        return 'Fecha Inválida';
      }
      return date.toLocaleString(); // Adjust to your desired locale and format
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Error de Fecha';
    }
  };


  const baseLang = i18n.language.split('-')[0];

  /* -------------- render -------------- */
  if (loading) return <Center><Text>{t('Cargando grupo...')}</Text></Center>;
  if (notFound || !group)
    return <Center><Text>{t('Grupo no encontrado.')}</Text></Center>;

  return (
    <Container size="lg" px="sm" py="xl">
      <Card
        withBorder
        radius="xl"
        padding="xl"
        shadow="md"
        className={classes.card}
        style={{ backgroundColor: '#fdfdfd' }}
      >
        <Stack spacing="lg">
          {/* Nombre, país y visitas */}
          {clan && (
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={700} fz="xl" lh={1.2}>
                  {clan?.name ?? 'Nombre del Clan'}
                </Text>
                <Text className={classes.statValue}>
                  {clan?.location?.name} ({clan?.location?.countryCode})
                </Text>
                <Text fz="xs" c="gray.6">
                  {clan?.tag} • {clan?.type === 'open' ? 't(Abierto)' : 't(Cerrado)'}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('El clan tiene')}{' '}
                  <strong>
                    {group.visitas || 0} {t('visitas')}
                  </strong>
                </Text>
              </div>
            </Group>
          )}

          {/* Descripción del Clan */}
          {/* Descripción alternativa */}
          { group.description && (
            <Box>
              <Text fw={600} mb={4}>
                {t('Descripción del Clan:')}
              </Text>
              <Text>
                {typeof group.description === 'object'
                  ? group.description[baseLang] ||
                    group.description.es ||
                    group.description.en ||
                    t('Sin descripción')
                  : group.description || t('Sin descripción')}
              </Text>
            </Box>
          )}

          <Divider my="md" />


          {clan?.description && (
            <Box>
              <Text c="gray.7" fz="sm" lineClamp={3}>
                {clan.description}
              </Text>
            </Box>
          )}


          {/* <Divider my="md" /> */}

          {/* Trofeos Requeridos y Trofeos de Guerra (Side-by-side) with Members badges */}
          <Stack gap="md">
            {/* Sección Superior: Botón a la izquierda, Insignia a la derecha */}
          <Group justify="space-between">
            {/* 1. Botón: Al usar "space-between", este primer elemento se alineará al extremo izquierdo */}
            {clan?.memberList?.length > 0 && (
              <Button
                color="blue"
                variant="light"
                radius="xl"
                onClick={open}
                style={{
                  height: rem(26),
                  width: 'auto',
                }}
                leftSection={<IconCornerLeftDown size={13} stroke={2.5} />}
              >
                {t('Ver Miembros del Clan')}
              </Button>
            )}

            {/* 2. Insignia: Este segundo elemento se alineará al extremo derecho */}
            {clan?.members && (
              <Badge color="grape" variant="light" size="lg" radius="xl">
                {clan.members}/50 {t('Miembros')}
              </Badge>
            )}
          </Group>

            {/* Sección Inferior: Estadísticas de Trofeos (sin cambios) */}
            <Group justify="space-around" wrap="nowrap" mt="xs">
              {/* Columna: Trofeos Requeridos */}
              <Stack gap={rem(4)} align="center">
                <Text fz="xl" fw={700}>
                  {clan?.requiredTrophies ?? '—'}
                </Text>
                <Group gap={rem(6)} wrap="nowrap">
                  <img
                    src="https://cdn.royaleapi.com/static/img/ui/64x64/trophy.png"
                    alt="Trofeos Requeridos"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Text size="sm" c="dimmed">
                    {t('Trofeos Requeridos')}
                  </Text>
                </Group>
              </Stack>

              {/* Columna: Trofeos de Guerra */}
              <Stack gap={rem(4)} align="center">
                <Text fz="xl" fw={700}>
                  {clan?.clanWarTrophies ?? '—'}
                </Text>
                <Group gap={rem(6)} wrap="nowrap">
                  <img
                    src="https://cdn.royaleapi.com/static/img/ui/64x64/cw-trophy.png"
                    alt="Trofeos de Guerra"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Text size="sm" c="dimmed">
                    {t('Trofeos de Guerra')}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Stack>

          <Divider my="md" />

          {/* Estadísticas Clave (as badges) */}
          {clan && (
            <Box mt="md" w="100%">
              <Text fz="xs" tt="uppercase" fw={700} mb="xs" c="dimmed">
                {t('Estadísticas Clave')}
              </Text>

              <Grid gutter="xs">
                {/* Puntaje del Clan */}
                <Grid.Col span={{ base: 6, xs: 3 }}>
                  <Group gap="xs" align="center">
                    <Text fz="xs" c="gray.7">
                      Clan Score
                    </Text>
                    <Badge className={classes.statBadge} variant="light" color="blue">
                      <Group gap={rem(4)} align="center">
                        <IconTrophy size={14} stroke={1.5} />
                        <Text fz="xs" fw={700}>
                          {clan?.clanScore ?? '—'}
                        </Text>
                      </Group>
                    </Badge>
                  </Group>
                </Grid.Col>

                {/* Donaciones Semanales */}
                <Grid.Col span={{ base: 6, xs: 3 }}>
                  <Group gap="xs" align="center">
                    <Text fz="xs" c="gray.7">
                      {t('Donaciones')}
                    </Text>
                    <Badge className={classes.statBadge} variant="light" color="green">
                      <Group gap={rem(4)} align="center">
                        <IconGift size={14} stroke={1.5} />
                        <Text fz="xs" fw={700}>
                          {clan?.donationsPerWeek ?? '—'}
                        </Text>
                      </Group>
                    </Badge>
                  </Group>
                </Grid.Col>

                {/* Cofre del Clan */}
                <Grid.Col span={{ base: 6, xs: 3 }}>
                  <Group gap="xs" align="center">
                    <Text fz="xs" c="gray.7">
                      {t('Miembros')}
                    </Text>
                    <Badge className={classes.statBadge} variant="light" color="orange">
                      <Group gap={rem(4)} align="center">
                        <IconShield size={14} stroke={1.5} />
                        <Text fz="xs" fw={700}>
                          {clan?.members ?? '—'} / 50
                        </Text>
                      </Group>
                    </Badge>
                  </Group>
                </Grid.Col>

                {/* Ubicación */}
                <Grid.Col span={{ base: 6, xs: 3 }}>
                  <Group gap="xs" align="center">
                    <Text fz="xs" c="gray.7">
                      {t('Ubicación')}
                    </Text>
                    <Badge className={classes.statBadge} variant="light" color="teal">
                      <Group gap={rem(4)} align="center">
                        <IconMapPin size={14} stroke={1.5} />
                        <Text fz="xs" fw={700}>
                          {clan?.location?.name ?? '—'}
                        </Text>
                      </Group>
                    </Badge>
                  </Group>
                </Grid.Col>
              </Grid>
            </Box>
          )}

          <Divider my="sm" />

          {/* Botones */}
          <Group justify="space-between" mt="md">
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={() => sendTelegramMessage('Reporte Enlace Roto')}
            >
              {t('Reportar Enlace roto')}
            </Button>
          </Group>

          <Button
            component="a"
            href={group.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            size="md"
            radius="xl"
            fw={700}
            fz="sm"
            style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            variant="light"
            color="blue"
            disabled={!group.link}
          >
            {group.link
              ? `${clan?.name ?? 'Clan name'} - ${t('Acceder al Clan')}`
              : t('Enlace no disponible')}
          </Button>
        </Stack>
      </Card>

      {/* Modal para Miembros del Clan */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={700}>Miembros del Clan: {clan?.name}</Text>}
        size="lg" // Adjust size as needed
        scrollAreaComponent={ScrollArea.Autosize} // Enable scrolling for long lists
        centered
      >
        <ScrollArea type="always">
          {clan?.memberList && clan.memberList.length > 0 ? (
            <Table
              striped
              highlightOnHover
              withTableBorder
              withColumnBorders
              sx={{
                th: {
                  backgroundColor: theme.colors.gray?.[1], // Light background for header
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  padding: theme.spacing.xs,
                  textAlign: 'left', // Ensure header text aligns left
                },
                td: {
                  padding: theme.spacing.xs,
                  fontSize: '0.9rem',
                },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Miembro</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Nivel</Table.Th>
                  <Table.Th>Trofeos</Table.Th>
                  <Table.Th>Donaciones</Table.Th>
                  <Table.Th>Última Conexión</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clan.memberList.map((member) => (
                  <Table.Tr key={member.tag}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        {/* Replace with actual avatar URL if available, or generate from name */}
                        <Avatar size="sm" radius="xl" color={theme.colors.grape?.[6]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ overflow: 'hidden' }}>
                          <Text fz="sm" fw={500} truncate>{member.name}</Text>
                          <Text fz="xs" c="dimmed" truncate>{member.tag}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          member.role === 'leader'
                            ? 'red'
                            : member.role === 'coLeader'
                            ? 'orange'
                            : member.role === 'elder'
                            ? 'blue'
                            : 'gray'
                        }
                        variant="light"
                      >
                        {member.role === 'leader'
                          ? 'Líder'
                          : member.role === 'coLeader'
                          ? 'Co-Líder'
                          : member.role === 'elder'
                          ? 'Veterano'
                          : 'Miembro'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{member.expLevel}</Table.Td>
                    <Table.Td>{member.trophies}</Table.Td>
                    <Table.Td>{member.donations}</Table.Td>
                    <Table.Td fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {formatLastSeen(member.lastSeen)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text>No hay miembros disponibles en este clan.</Text>
          )}
        </ScrollArea>
      </Modal>
    </Container>
  );

  /* ------------------ helpers ------------------ */
  async function sendTelegramMessage(tipo) {
    const chatId = -1002622285468
    const token = "7551745963:AAFiTkb9UehxZMXNINihI8wSdlTMjaM6Lfk"

    const url = window.location.href;

    const text = `🚨 *Nuevo: ${tipo}*\nGrupo: ${group?.name}\nURL: ${url}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description);
      showNotification({ title: t('Reporte enviado'), message: t('¡Gracias!'), color: 'green' });
    } catch (e) {
      console.error(e);
      showNotification({ title: t('Error'), message: t('No se pudo enviar.'), color: 'red' });
    }
  }
}