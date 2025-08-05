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
  ScrollArea, Tooltip,
  Table, useMantineTheme, Avatar,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks'; // Hook for modal state management
import slugify from '@/lib/slugify';
import { useTranslation } from 'react-i18next';
import classes from '@/app/styles/DetailsClans.module.css'; // Your existing CSS module

// Import all the icons you'll use directly in this file
import {
  IconTrophy, IconGift, IconShield, IconMapPin, IconTarget, IconCornerLeftDown,
  IconBrandDiscord,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandFacebook,
  IconLink,
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
  const [openMembers, membersHandlers] = useDisclosure(false);
  const [openReport, reportHandlers] = useDisclosure(false);
  const [sent, setSent] = useState(false);
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);
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

  const [globalRank, setGlobalRank] = useState(null);
  const [localRank, setLocalRank] = useState(null);







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
        setGlobalRank(result.globalRank ?? null);
        setLocalRank(result.localRank ?? null);
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
    <div className={classes.clanPageBg}>
      <Container size="lg" px="sm" py="xl">
        <Card
          withBorder={false}
          radius="2xl"
          padding={0}
          shadow="none"
          style={{
            backgroundColor: '#0A1828',
            backgroundImage: 'url("/escudo.png")',
            backgroundSize: '65% 95%',        // ajusta al tamaño que prefieras
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',     // o 'top center'
            borderRadius: '1.5rem',
            overflow: 'hidden',
            height: '15rem',
            maxWidth: '30rem',
            margin: '0 auto',
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Contenedor para elevar el contenido sobre la imagen de fondo */}
          <Box
            p="2rem"
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Aquí va todo tu contenido: título, descripción, badges, etc. */}
          <Text
            fw={700}
            fz="2rem"
            lh={1}
            className={classes.goldEffect}
            data-text={clan?.name ?? 'BLACK NIGHTMARE'}
          >
            {clan?.name ?? 'BLACK NIGHTMARE'}
          </Text>
          
          <Text mt="xs" c="#E9F1FA" fz="md">
            {clan?.location?.name} ({clan?.location?.countryCode})
          </Text>
          <Text mt="xs" c="#FFFFFF" fz="sm" style={{ opacity: 0.8 }}>
            {clan?.tag} · {clan?.type === 'open' ? 'Abierto' : 'Cerrado'}
          </Text>
        </Box>
        </Card>
        <Card
          withBorder
          radius="xl"
          padding="xl"
          shadow="md"
          className={classes.card}
          style={{ backgroundColor: '#E9F1FA' }}
        >
          <Stack >
            { clan?.description && (
              <Box>
                <Text  fz="md" lineClamp={3}>
                  {clan.description}
                </Text>

              </Box>
            )}
            <Stack gap="md">
            <Group justify="space-between">
              {/* 1. Botón: Al usar "space-between", este primer elemento se alineará al extremo izquierdo */}
              {clan?.memberList?.length > 0 && (
                <Button
                  onClick={membersHandlers.open}
                  style={{
                    height: rem(28),
                    width: 'auto',
                    color: '#FFFFFF', 
                    backgroundColor: '#0E4C84',
                    borderRadius: rem(10),
                  }}
                >
                  {t('Ver Miembros del Clan')}
                </Button>
              )}

              {/* 2. Insignia: Este segundo elemento se alineará al extremo derecho */}
              {clan?.members && (
                <Badge color="blue" variant="light" style={{ height: rem(28), fontSize: rem(12), borderRadius: rem(10) }}>
                  {clan.members}/50 {t('Miembros')}
                </Badge>
              )}
            </Group>

              {/* Sección Inferior: Estadísticas de Trofeos (sin cambios) */}
              <Group justify="space-around" wrap="nowrap" mt="xs">
                {/* Columna: Trofeos Requeridos */}
                <Stack gap={rem(4)} align="center">
                  <Text fz="xl" fw={800}>
                    {clan?.requiredTrophies ?? '—'}
                  </Text>
                  <Group gap={rem(6)} wrap="nowrap">
                    <img
                      src="https://cdn.royaleapi.com/static/img/ui/64x64/trophy.png"
                      alt="Trofeos Requeridos"
                      style={{ width: '20px', height: '20px' }}
                    />
                    <Text size="sm" >
                      {t('Trofeos Requeridos')}
                    </Text>
                  </Group>
                </Stack>

                {/* Columna: Trofeos de Guerra */}
                <Stack gap={rem(4)} align="center">
                  <Text fz="xl" fw={800}>
                    {clan?.clanWarTrophies ?? '—'}
                  </Text>
                  <Group gap={rem(6)} wrap="nowrap">
                    <img
                      src="https://cdn.royaleapi.com/static/img/ui/64x64/cw-trophy.png"
                      alt="Trofeos de Guerra"
                      style={{ width: '20px', height: '20px' }}
                    />
                    <Text size="sm" >
                      {t('Trofeos de Guerra')}
                    </Text>
                  </Group>
                </Stack>
              </Group>
            </Stack>

            {/* Estadísticas Clave (as badges) */}
            {clan && (
              <Box mt="md" w="100%">
                <Grid gutter="xs">
                  {/* Puntaje del Clan */}
                  <Grid.Col span={{ base: 6, xs: 3 }}>
                    <Group gap="xs" align="center">
                      <Text fz="xs" c="gray.7">
                        Clan Score
                      </Text>
                        <Badge
                          style={{
                          backgroundColor: '#EAF4FF',  // azul muy claro
                          color: '#002C58',            // texto
                          fontWeight: 700
                        }}
                        >
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
                      <Badge
                        style={{
                          backgroundColor: '#EAF4FF',  // azul muy claro
                          color: '#002C58',            // texto
                          fontWeight: 700
                        }}
                      >
                        <Group gap={rem(4)} align="center">
                          <IconGift size={14} stroke={1.5} />
                          <Text fz="xs" fw={700}>
                            {clan?.donationsPerWeek ?? '—'}
                          </Text>
                        </Group>
                      </Badge>
                    </Group>
                  </Grid.Col>

  
                  {/* Ranking Global */}
                  {globalRank && (
                    <Grid.Col span={{ base: 6, xs: 3 }}>
                      <Group gap="xs" align="center">
                        <Text fz="xs" c="gray.7">
                          Ranking Global
                        </Text>
                        <Badge
                          style={{
                          backgroundColor: '#efb810',  // azul muy claro
                          color: '#002C58',            // texto
                          fontWeight: 700
                        }}
                        >
                          <Text fz="xs" fw={800}>#{globalRank}</Text>
                        </Badge>
                      </Group>
                    </Grid.Col>
                  )}

                  {/* Ranking Local */}
                  {localRank && (
                    <Grid.Col span={{ base: 6, xs: 3 }}>
                      <Group gap="xs" align="center">
                        <Text fz="xs" c="gray.7">
                          Ranking Local
                        </Text>
                        <Badge className={classes.goldEffect}
                        style={{
                          backgroundColor: '#EAF4FF',  // azul muy claro
                          // color: '#002C58',            // texto
                          fontWeight: 700
                        }}
                        >
                         <Text fz="xs" fw={800}># {localRank}</Text>
                        </Badge>
                      </Group>
                    </Grid.Col>
                  )}

                  {/* Ubicación */}
                  <Grid.Col span={{ base: 6, xs: 3 }}>
                    <Group gap="xs" align="center">
                      <Text fz="xs" c="gray.7">
                        {t('Ubicación')}
                      </Text>
                      <Badge
                        style={{
                          backgroundColor: '#EAF4FF',  // azul muy claro
                          color: '#002C58',            // texto
                          fontWeight: 700
                        }}
                      >  
                      <Group gap={rem(4)} align="center">
                          <Text fz="xs" fw={700}>
                            {clan?.location?.name ?? '—'}
                          </Text>
                        </Group>
                      </Badge>
                    </Group>
                  </Grid.Col>


                </Grid>

                <Text fz="xs" mt="md">
                  Clan groups
                </Text>

                <Group mt="xs" spacing="sm">
                  {group?.comunidades?.discord && (
                    <Tooltip label="Discord">
                      <Button
                        component="a"
                        href={group.comunidades.discord}
                        target="_blank"
                        variant="light"
                        color="indigo"
                        size="xs"
                        leftSection={<IconBrandDiscord size={16} />}
                      >
                        Discord
                      </Button>
                    </Tooltip>
                  )}

                  {group?.comunidades?.whatsapp && (
                    <Tooltip label="WhatsApp">
                      <Button
                        component="a"
                        href={group.comunidades.whatsapp}
                        target="_blank"
                        variant="light"
                        color="green"
                        size="xs"
                        leftSection={<IconBrandWhatsapp size={16} />}
                      >
                        WhatsApp
                      </Button>
                    </Tooltip>
                  )}

                  {group?.comunidades?.telegram && (
                    <Tooltip label="Telegram">
                      <Button
                        component="a"
                        href={group.comunidades.telegram}
                        target="_blank"
                        variant="light"
                        color="blue"
                        size="xs"
                        leftSection={<IconBrandTelegram size={16} />}
                      >
                        Telegram
                      </Button>
                    </Tooltip>
                  )}

                  {group?.comunidades?.facebook && (
                    <Tooltip label="Facebook">
                      <Button
                        component="a"
                        href={group.comunidades.facebook}
                        target="_blank"
                        variant="light"
                        color="blue"
                        size="xs"
                        leftSection={<IconBrandFacebook size={16} />}
                      >
                        Facebook
                      </Button>
                    </Tooltip>
                  )}
                </Group>

              </Box>
            )}

            {/* Botones */}
            <Group justify="space-between" mt="md">
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={reportHandlers.open}
              >
                {t('Report Broken Link')}
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
              style={{ textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF', backgroundColor: '#0E4C84' }}
              disabled={!group.link}
            >
              {group.link
                ? `${clan?.name ?? 'Clan name'} - ${t('Acceder al Clan')}`
                : t('Enlace no disponible')}
            </Button>

            <Modal centered opened={openReport}  onClose={() => {
              reportHandlers.close();
              setReportText('');
              setSent(false);
            }} title={t('Report Broken Link')}>
              <Stack>
                {!sent ? (
                  <>
                    <Text size="sm">{t('Briefly describe the problem (min. 10 and max. 200 characters)):')}</Text>
                    <textarea
                      maxLength={200}
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder={t('E.g. The link leads to the wrong group or no longer exists.')}
                      style={{ width: '100%', minHeight: 100, padding: 8, borderRadius: 4, borderColor: '#ccc' }}
                    />
                    <Text size="xs" c="dimmed">
                      {reportText.length} / 200
                      {reportText.length > 0 && reportText.length < 10 && ` – ${t('Too short')}`}
                    </Text>

                    <Group justify="flex-end">
                      <Button
                        size="sm"
                        color="gray"
                        variant="outline"
                        onClick={() => {
                          close();
                          setReportText('');
                          setSent(false);
                        }}
                      >
                        {t('Cancelar')}
                      </Button>
                      <Button
                        size="sm"
                        color="red"
                        loading={sending}
                        disabled={reportText.trim().length < 10}
                        onClick={async () => {
                          setSending(true);
                          await sendTelegramMessage('Broken link', reportText.trim());
                          setSending(false);
                          setReportText('');
                          setSent(true);
                        }}
                      >
                        {t('Submit report')}
                      </Button>
                    </Group>
                  </>
                ) : (
                  <Center>
                    <Text ta="center" fw={600} size="lg">
                      {t('¡The message has been sent and will be reviewed soon. Thank you for your help.!')}
                    </Text>
                  </Center>
                )}
              </Stack>
            </Modal>
          </Stack>
        </Card>

        {/* Modal para Miembros del Clan */}
        <Modal
          opened={openMembers}
          onClose={membersHandlers.close}
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
                    <Table.Th>Member</Table.Th>
                    <Table.Th>Rol</Table.Th>
                    <Table.Th>Level</Table.Th>
                    <Table.Th>Trophies</Table.Th>
                    <Table.Th>Donations</Table.Th>
                    <Table.Th>Last Connection</Table.Th>
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
              <Text>There are no members available in this clan</Text>
            )}
          </ScrollArea>
        </Modal>
      </Container>
    </div>
  );

  /* ------------------ helpers ------------------ */
  async function sendTelegramMessage(tipo, mensaje = '') {
    const chatId = -1002622285468;
    const token  = "7551745963:AAFiTkb9UehxZMXNINihI8wSdlTMjaM6Lfk";

    const url = window.location.href;

    const text = `🚨 *Nuevo reporte: ${tipo}*\n` +
                `Clan: ${group?.name}\n` +
                `URL: ${url}\n` +
                `📝 Descripción: ${mensaje || 'Sin descripción'}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description);
      showNotification({ title: t('Reporte enviado'), message: t('¡Gracias por ayudarnos!'), color: 'green' });
    } catch (e) {
      console.error(e);
      showNotification({ title: t('Error'), message: t('No se pudo enviar el reporte.'), color: 'red' });
    }
  }
}