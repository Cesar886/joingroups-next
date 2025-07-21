import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  limit, runTransaction, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Box, Button, Center, Container, Divider,
  Group, Paper, Stack, Text, Title, Badge,
  Modal,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import slugify from '../assets/slugify';     // ⬅️ el mismo helper que usas en TableSort
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';

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


export default function GroupDetail() {
  const { t, i18n } = useTranslation();
  const { id, tipo } = useParams();                // id === slug recibido en la URL
  const [group, setGroup]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        // 1️⃣  Intenta encontrar por slug
        const q = query(
          collection(db, 'groups'),
          where('slug', '==', id),
          limit(1)
        );
        let snap = await getDocs(q);

        // 2️⃣  Si no hay slug en esos docs viejos, busca por nombre “slugificado”
        if (snap.empty) {
          const allQ = query(collection(db, 'groups'), limit(1000)); // o por páginas
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
        const docRef  = docSnap.ref;
        const data    = docSnap.data();


        // 3️⃣  Si el documento no traía slug, lo actualizamos aquí mismo
        if (!data.slug) {
          await updateDoc(docRef, { slug: slugify(data.name) });
        }

        /* -------------------  visitas ------------------- */
        const visitKey   = `visitado-${id}`;
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

  const baseLang = i18n.language.split('-')[0];

  const isChromeMobile =
    /Chrome/.test(navigator.userAgent) &&
    /Android/.test(navigator.userAgent) &&
    !/OPR|Edge/.test(navigator.userAgent);
    



  /* -------------- render -------------- */
  if (loading)   return <Center><Text>{t('Cargando grupo...')}</Text></Center>;
  if (notFound || !group)
    return <Center><Text>{t('Grupo no encontrado.')}</Text></Center>;

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="sm" radius="md" p="lg">
        <Stack spacing="md">
          
          <Title order={2}>{group.name}</Title>

          <Group justify="space-between" align="center" w="100%">
            <Text size="sm" c="dimmed">
              {t('El grupo tiene')} <strong>{group.visitas || 0} {t('visitas')}</strong>
            </Text>

            {group.city && (
              <Text size="xl" style={{ fontSize: '1.5rem' }}>
                {countryMap[group.city] || group.city}
              </Text>
            )}
          </Group>

          <Divider/>

          <Box>
            <Text fw={600} mb={4}>{t('Descripción:')}</Text>
          <Text>
            {typeof group.description === 'object'
              ? group.description[baseLang] || group.description.es || group.description.en || t('Sin descripción')
              : group.description || t('Sin descripción')}
          </Text>

          </Box>

          <Group gap="sm" mt="md">
            {Array.isArray(group.categories) && group.categories.length > 0 ? (
              group.categories.map((cat, i) => (
                <Badge key={i} variant="light" color="violet" size="lg" radius="md">
                  {cat}
                </Badge>
              ))
            ) : (
              <Badge variant="light" color="gray" size="lg">
                {t('Sin categoría')}
              </Badge>
            )}
          </Group>



          <Box mt="md" bg="#f9f9f9" p="md" radius="md" style={{ borderLeft: '4px solid rgb(33, 85, 255)' }}>
            <Text size="sm" c="dimmed">
              {t('Recuerda: evita compartir información personal en')} <strong>{group.name}</strong>. {t('Nunca se sabe quién puede estar leyendo. Mantengamos')} <strong>{group.name}</strong> {t('como un espacio seguro y agradable para todos.')}
            </Text>
          </Box>

          <Group justify="space-between" mt="md">
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={open}
            >
              {t('Reportar Enlace roto')}
            </Button>
          </Group>

          <Divider my="sm" />

          <Button
            fullWidth
            variant="filled"
            color="blue"
            disabled={!group.link}
            onClick={() => {
              if (isChromeMobile) {
                window.location.replace(group.link);
              } else {
                const a = document.createElement('a');
                a.href = group.link;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.click();
              }
            }}
          >
            {group.link
              ? t(`${(tipo || group?.tipo || 'telegram')[0].toUpperCase() + (tipo || group?.tipo || 'telegram').slice(1)} - ACCEDER AL GRUPO`)
              : t('Enlace no disponible')}

          </Button>
          <Modal centered opened={opened} onClose={() => {
            close();
            setReportText('');
            setSent(false);
          }} title={t('Reportar Enlace roto')}>
            <Stack>
              {!sent ? (
                <>
                  <Text size="sm">{t('Describe brevemente el problema (mín. 10 y máx. 200 caracteres):')}</Text>
                  <textarea
                    maxLength={200}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder={t('Ej. El enlace lleva a un grupo equivocado o ya no existe.')}
                    style={{ width: '100%', minHeight: 100, padding: 8, borderRadius: 4, borderColor: '#ccc' }}
                  />
                  <Text size="xs" c="dimmed">
                    {reportText.length} / 200
                    {reportText.length > 0 && reportText.length < 10 && ` – ${t('Demasiado corto')}`}
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
                        await sendTelegramMessage('Enlace roto', reportText.trim());
                        setSending(false);
                        setReportText('');
                        setSent(true);
                      }}
                    >
                      {t('Enviar reporte')}
                    </Button>
                  </Group>
                </>
              ) : (
                <Center>
                  <Text ta="center" fw={600} size="lg">
                    {t('¡Se ha enviado el mensaje y, sera revisado pronto ¡Gracias por tu ayuda!')}
                  </Text>
                </Center>
              )}
            </Stack>
          </Modal>
        </Stack>
      </Paper>
    </Container>
  );

  /* ------------------ helpers ------------------ */
  async function sendTelegramMessage(tipo, mensaje = '') {
    const chatId = -1002622285468;
    const token  = "7551745963:AAFiTkb9UehxZMXNINihI8wSdlTMjaM6Lfk";

    const url = window.location.href;

    const text = `🚨 *Nuevo reporte: ${tipo}*\n` +
                `Grupo: ${group?.name}\n` +
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
