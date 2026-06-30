"use client";
import {
  Title,
  Text,
  Button,
  Container,
  Stack,
  Group,
  Box,
  Center,
  Divider,
} from '@mantine/core';
import Link from 'next/link';
import {
  IconFlame,
  IconTrendingUp,
  IconCrown,
  IconStar,
  IconNews,
  IconChevronRight,
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import styles from '@/app/styles/Page.module.css';
import { useEffect, useState, useRef } from 'react';
import { db } from '@/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import slugify from '@/lib/slugify';
import '@/locales/i18n';



const countryMap = {
  mx: '🇲🇽', us: '🇺🇸', ar: '🇦🇷', co: '🇨🇴', es: '🇪🇸',
  pe: '🇵🇪', cl: '🇨🇱', ve: '🇻🇪', br: '🇧🇷', ec: '🇪🇨',
  gt: '🇬🇹', bo: '🇧🇴', do: '🇩🇴', hn: '🇭🇳', py: '🇵🇾',
  sv: '🇸🇻', ni: '🇳🇮', cr: '🇨🇷', pa: '🇵🇦', uy: '🇺🇾',
  pr: '🇵🇷', ca: '🇨🇦', de: '🇩🇪', fr: '🇫🇷', it: '🇮🇹',
  gb: '🇬🇧', nl: '🇳🇱', pt: '🇵🇹', jp: '🇯🇵', kr: '🇰🇷',
  cn: '🇨🇳', in: '🇮🇳', ru: '🇷🇺', au: '🇦🇺',
};


const featuredButtons = [
  { to: '/comunidades/grupos-de-telegram?orden=top', label: 'Top grupos de Telegram', icon: <IconFlame size={15} />, color: 'cyan' },
  { to: '/comunidades?orden=top', label: 'Más vistos', icon: <IconTrendingUp size={15} />, color: 'orange' },
  { to: '/clanes/clanes-de-clash-royale', label: 'Clanes de Clash Royale', icon: <IconCrown size={15} />, color: 'violet' },
  { to: '/comunidades/grupos-de-whatsapp?orden=top', label: 'Top grupos de WhatsApp', icon: <IconStar size={15} />, color: 'teal' },
  { to: '/comunidades?orden=nuevos', label: 'Nuevos grupos', icon: <IconNews size={15} />, color: 'blue' },
  { to: '/clanes/clanes-de-clash-of-clans', label: 'Clanes Clash of Clans', icon: <IconStar size={15} />, color: 'violet' },
];

export default function HomeClient({ serverData }) {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [clanes, setClanes] = useState([]);
  const baseLang = typeof i18n.language === 'string' ? i18n.language.split('-')[0] : 'es';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [buttonPosition, setButtonPosition] = useState('top-left');
  const positionRef = useRef('top-left');
  const [groupsTelegram, setGroupsTelegram] = useState([]);
  const [groupsWhatsapp, setGroupsWhatsapp] = useState([]);
  const [showAllCatsHome, setShowAllCatsHome] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const allGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sortedGroups = [...allGroups]
        .filter(g => g.createdAt)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      const destacadosGroups = sortedGroups.filter(g => g.destacado === true);
      const sinDestacados = sortedGroups.filter(g => !destacadosGroups.some(d => d.id === g.id));
      setGroups([...destacadosGroups, ...sinDestacados].slice(0, 5));

      const destacadosTelegram = sortedGroups.filter(g => g.tipo?.toLowerCase() === 'telegram' && g.destacado === true);
      const nuevosTelegram = sortedGroups.filter(g => g.tipo?.toLowerCase() === 'telegram' && !destacadosTelegram.some(d => d.id === g.id));
      setGroupsTelegram([...destacadosTelegram, ...nuevosTelegram].slice(0, 5));

      const destacadosWhatsapp = sortedGroups.filter(g => g.tipo?.toLowerCase() === 'whatsapp' && g.destacado === true);
      const nuevosWhatsapp = sortedGroups.filter(g => g.tipo?.toLowerCase() === 'whatsapp' && !destacadosWhatsapp.some(d => d.id === g.id));
      const whatsappPriorityName = '☆꧁༒☬ṡẗïċḳëṛṡ❤️༒꧂';
      const whatsappSorted = [...destacadosWhatsapp, ...nuevosWhatsapp];
      const whatsappPriorityGroups = whatsappSorted.filter((group) => group.name === whatsappPriorityName);
      const whatsappRemainingGroups = whatsappSorted.filter((group) => group.name !== whatsappPriorityName);
      setGroupsWhatsapp([...whatsappPriorityGroups, ...whatsappRemainingGroups].slice(0, 5));

      const clanesSnapshot = await getDocs(collection(db, 'clanes'));
      const allClanes = clanesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const destacadosClanes = allClanes.filter(c => c.destacado === true);
      const nuevosClanes = allClanes
        .filter(c => c.createdAt)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .filter(c => !destacadosClanes.some(d => d.id === c.id))
        .slice(0, 4 - destacadosClanes.length);
      setClanes([...destacadosClanes, ...nuevosClanes]);
    };

    fetchData();
  }, []);


  useEffect(() => {
    const positions = ['top-left', 'bottom-right', 'top-right', 'bottom-left'];
    const changePosition = () => {
      let next;
      do { next = positions[Math.floor(Math.random() * positions.length)]; }
      while (next === positionRef.current);
      setButtonPosition(next);
      positionRef.current = next;
    };
    const interval = setInterval(changePosition, 10000);
    return () => clearInterval(interval);
  }, []);


  const renderCard = (row, idx, isGroup = true) => {
    const slug = row.slug || slugify(row.name);
    const iconSrc = isGroup
      ? (row.tipo?.trim().toLowerCase() === 'telegram' ? '/telegramicons.png' : '/wapp.webp')
      : (row.tipo === 'clash-royale' ? '/clashRoyaleFondo1.png' : '/clashOfClansFondo.png');

    const descriptionText =
      typeof row.description === 'object'
        ? row.description[baseLang] || row.description[i18n.language] || row.description.es
        : row.description;

    const categoria = Array.isArray(row.categories)
      ? row.categories[0] || 'otros'
      : row.categories || 'otros';
    const basePath = isGroup
      ? `/comunidades/grupos-de-${row.tipo}/${slugify(categoria)}`
      : `/clanes/clanes-de-${row.tipo}`;
    const href = `${basePath}/${slug}`;

    return (
      <div key={`${row.id}-${idx}`}>
        <Link href={href} className={styles.groupRow}>
          <img src={iconSrc} alt={row.name} className={styles.groupIcon} loading="lazy" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {row.city && (
                <span className={styles.countryFlag}>{countryMap[row.city]}</span>
              )}
              <span className={styles.groupName}>{row.name}</span>
            </div>
            <div className={styles.groupDesc}>{descriptionText}</div>
          </div>
          <IconChevronRight size={15} style={{ color: '#D1D5DB', flexShrink: 0 }} />
        </Link>
        {idx < 4 && <div className={styles.groupDivider} />}
      </div>
    );
  };

  const floatingStyle = (position) => {
    const common = { position: 'fixed', zIndex: 1000, animation: 'pulse 2s infinite' };
    switch (position) {
      case 'top-left':     return { ...common, top: '70px', left: '20px' };
      case 'bottom-right': return { ...common, bottom: '20px', right: '20px' };
      case 'top-right':    return { ...common, top: '70px', right: '20px' };
      case 'bottom-left':  return { ...common, bottom: '20px', left: '20px' };
      default:             return common;
    }
  };


  return (
    <>
      <Container component="main" size="lg" py="md" className={styles.mobileContainerFix}>

        {/* ── Hero ── */}
        <Stack align="center" spacing="md" px="md" mt="xl" mb="lg">
          <Title
            order={1}
            ta="center"
            fw={800}
            fz={isMobile ? 26 : 40}
            lh={1.15}
            style={{ letterSpacing: 0 }}
          >
            <span className={styles.heroGradientText}>
              {isMobile
                ? 'Clanes de Clash Royale activos'
                : 'Clanes de Clash Royale y comunidades activas'}
            </span>
          </Title>

          <Text ta="center" fz={isMobile ? 'sm' : 'md'} maw={580} mx="auto"
            style={{ color: '#6B7280', lineHeight: 1.65 }}>
            {isMobile
              ? 'Busca clanes de Clash Royale, publica tu clan y únete a comunidades activas.'
              : <>
                  En <strong style={{ color: '#374151' }}>JoinGroups.lat</strong> puedes buscar <strong style={{ color: '#374151' }}>clanes de Clash Royale</strong>,
                  publicar clan para <strong style={{ color: '#374151' }}>reclutar miembros</strong> y unirte a clanes activos. También puedes explorar
                  comunidades de <strong style={{ color: '#374151' }}>Telegram</strong> y <strong style={{ color: '#374151' }}>WhatsApp</strong> por temática.
                </>
            }
          </Text>

          <Group justify="center" gap="sm">
            <Button
              size="md"
              component={Link}
              href="/clanes/clanes-de-clash-royale"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none',
                fontWeight: 600,
                fontSize: '14.5px',
                padding: '0 24px',
                height: 44,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              Buscar clanes de Clash Royale
            </Button>
            <Button
              size="md"
              component={Link}
              href="/clanes/publicar-clan"
              radius="xl"
              variant="light"
              color="violet"
              style={{ fontWeight: 700, fontSize: '14px', height: 44 }}
            >
              Publicar clan
            </Button>
          </Group>
        </Stack>


        {/* ── Scrolling Pills ── */}
        <Box className={styles['scrolling-container']} mt="lg">
          <div className={styles['scrolling-track']}>
            {[...featuredButtons, ...featuredButtons].map((b, i) => (
              <Button
                key={i}
                component={Link}
                href={b.to}
                leftSection={b.icon}
                variant="light"
                radius="xl"
                color={b.color}
                size="xs"
                style={{
                  whiteSpace: 'nowrap',
                  pointerEvents: 'auto',
                  flexShrink: 0,
                  fontWeight: 500,
                  fontSize: '12.5px',
                }}
              >
                {b.label}
              </Button>
            ))}
          </div>
        </Box>


        {/* ── Clanes Section ── */}
        <Box mt="xl" className={[styles.sectionCard, styles.clanesSection].filter(Boolean).join(" ")}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.badgeClanes}`}>
              <IconCrown size={11} />
              Clanes
            </span>
            <Title order={2} fz={isMobile ? 17 : 20} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
              {isMobile ? 'Clanes destacados' : 'Clanes de Clash Royale y otros destacados'}
            </Title>
          </div>

          <div style={{ padding: '0 8px 8px' }}>
            {clanes.map((clan, i) => renderCard(clan, i, false))}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Button
              variant="subtle"
              component={Link}
              href="/clanes/clanes-de-clash-royale"
              color="violet"
              size="sm"
              radius="md"
              rightSection={<IconChevronRight size={14} />}
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              Ver clanes de Clash Royale
            </Button>
          </div>
        </Box>


        {/* ── WhatsApp Section ── */}
        <Box mt="lg" className={[styles.sectionCard, styles.whatsappSection].filter(Boolean).join(" ")}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.badgeWhatsapp}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.029 18.88a9.893 9.893 0 01-4.731-1.204L3 19l1.358-4.186A9.86 9.86 0 012.1 9.937C2.1 4.502 6.564.04 12.029.04c5.465 0 9.929 4.462 9.929 9.96s-4.464 9.88-9.929 9.88z"/>
              </svg>
              WhatsApp
            </span>
            <Title order={2} fz={isMobile ? 17 : 20} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
              {isMobile ? 'Grupos de WhatsApp' : 'Grupos nuevos y destacados de WhatsApp'}
            </Title>
          </div>

          <div style={{ padding: '0 8px 8px' }}>
            {groupsWhatsapp.map((group, i) => renderCard(group, i, true))}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Button
              variant="subtle"
              component={Link}
              href="/comunidades/grupos-de-whatsapp"
              color="teal"
              size="sm"
              radius="md"
              rightSection={<IconChevronRight size={14} />}
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              {t('Ver todos los grupos de WhatsApp')}
            </Button>
          </div>
        </Box>


        {/* ── Telegram Section ── */}
        <Box mt="lg" className={[styles.sectionCard, styles.telegramSection].filter(Boolean).join(" ")}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.badgeTelegram}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Telegram
            </span>
            <Title order={2} fz={isMobile ? 17 : 20} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
              {isMobile ? 'Grupos de Telegram' : 'Grupos nuevos y destacados de Telegram'}
            </Title>
          </div>

          <div style={{ padding: '0 8px 8px' }}>
            {groupsTelegram.map((group, i) => renderCard(group, i, true))}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="subtle"
              component={Link}
              href="/comunidades/grupos-de-telegram"
              color="blue"
              size="sm"
              radius="md"
              rightSection={<IconChevronRight size={14} />}
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              {t('Ver todos los grupos de Telegram')}
            </Button>
            <Button
              variant="light"
              component={Link}
              href="/comunidades"
              color="gray"
              size="sm"
              radius="md"
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              {t('Todas las comunidades')}
            </Button>
          </div>
        </Box>


        {/* ── Publish Clan CTA ── */}
        <Center mt="xl">
          <Button
            component={Link}
            href="/clanes/publicar-clan"
            radius="xl"
            size="md"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              padding: '0 28px',
              height: 44,
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            }}
          >
            Publicar clan de Clash Royale
          </Button>
        </Center>

        {/* ── Categorías de Telegram ── */}
        <Box mt="xl" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.badgeTelegram}`} style={{ display: isMobile ? 'none' : undefined }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Categorías
            </span>
            <Title order={2} fz={isMobile ? 17 : 20} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
              Grupos de Telegram por tema
            </Title>
          </div>
          <Text fz="sm" mb={isMobile ? 'md' : 'lg'} px="md" style={{ color: '#6B7280', marginTop: 0 }}>
            Explora comunidades activas organizadas por categoría.
          </Text>
          <Box px="md" pb="md">
            <div style={{
              position: 'relative',
              maxHeight: showAllCatsHome ? 'none' : '88px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
            }}>
              <Group gap="xs" wrap="wrap">
                {[
                  { href: '/comunidades/grupos-de-telegram/tributos', label: 'Tributos Telegram' },
                  { href: '/comunidades/grupos-de-telegram/grupos-caseros', label: 'Grupos Caseros España' },
                  { href: '/comunidades/grupos-de-telegram/packs', label: 'Packs Telegram' },
                  { href: '/comunidades/grupos-de-telegram/desnudas', label: 'Telegram Desnudas' },
                  { href: '/comunidades/grupos-de-telegram/peliculas', label: 'Películas Telegram' },
                  { href: '/comunidades/grupos-de-telegram/hot', label: 'Hot' },
                  { href: '/comunidades/grupos-de-telegram/porno', label: 'Porno' },
                  { href: '/comunidades/grupos-de-telegram/xxx', label: 'Xxx' },
                  { href: '/comunidades/grupos-de-telegram/18', label: '18+' },
                  { href: '/comunidades/grupos-de-telegram/nsfw', label: 'NSFW' },
                  { href: '/comunidades/grupos-de-telegram/stickers', label: 'Stickers' },
                  { href: '/comunidades/grupos-de-telegram/anime-y-manga', label: 'Anime y Manga' },
                  { href: '/comunidades/grupos-de-telegram/emprendimiento', label: 'Emprendimiento' },
                  { href: '/comunidades/grupos-de-telegram/futbol', label: 'Fútbol' },
                  { href: '/comunidades/grupos-de-telegram/gaming', label: 'Gaming' },
                  { href: '/comunidades/grupos-de-telegram/negocios-y-finanzas', label: 'Negocios y Finanzas' },
                  { href: '/comunidades/grupos-de-telegram/ofertas-y-descuentos', label: 'Ofertas y Descuentos' },
                  { href: '/comunidades/grupos-de-telegram/peliculas-y-series', label: 'Películas y Series' },
                  { href: '/comunidades/grupos-de-telegram/telegram-bots', label: 'Telegram bots' },
                ].map((item) => (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    variant="light"
                    color="cyan"
                    size="xs"
                    radius="xl"
                    style={{
                      fontWeight: 500,
                      fontSize: isMobile ? '11.5px' : '12.5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Group>
              {!showAllCatsHome && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: 'linear-gradient(to bottom, transparent, #FFFFFF)',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
            <button
              onClick={() => setShowAllCatsHome(!showAllCatsHome)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                padding: 0,
                background: 'none',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#229ED9',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#0369A1'}
              onMouseLeave={e => e.currentTarget.style.color = '#229ED9'}
            >
              {showAllCatsHome ? 'Ver menos' : 'Ver más'}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: 12,
                  height: 12,
                  transition: 'transform 0.2s ease',
                  transform: showAllCatsHome ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </Box>
        </Box>

        {/* ── SEO Content ── */}
        <Box mt="lg" className={styles.seoSection} mx="auto">
          <Divider mb="lg" style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
          <Title order={2} mb="md" fz={isMobile ? 18 : 22} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
            Encuentra y publica clanes de Clash Royale en JoinGroups
          </Title>

          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            Si buscas <strong style={{ color: '#374151' }}>clanes de Clash Royale</strong>, JoinGroups te ayuda a comparar opciones reales antes de unirte: nombre del clan, descripción, miembros, requisitos y enlace oficial cuando está disponible.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            También puedes <strong style={{ color: '#374151' }}>publicar clan</strong> gratis para <strong style={{ color: '#374151' }}>reclutar miembros</strong> activos. Una ficha clara con requisitos, actividad y objetivos ayuda a que los jugadores adecuados encuentren tu clan.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            El objetivo es simple: que puedas <strong style={{ color: '#374151' }}>buscar clan de Clash Royale</strong>, revisar si encaja con tu estilo de juego y <strong style={{ color: '#374151' }}>unirse a clanes activos</strong> sin perder tiempo.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            Además del directorio de clanes, JoinGroups mantiene comunidades de Telegram y WhatsApp para quienes buscan grupos por categoría, país o tema.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            En <strong style={{ color: '#374151' }}>JoinGroups</strong> priorizamos la seguridad: no recopilamos datos personales y verificamos cada enlace manualmente. Nuestra misión es ayudarte a <strong style={{ color: '#374151' }}>conectar</strong> con <strong style={{ color: '#374151' }}>personas</strong> reales y comunidades auténticas, sin spam.
          </Text>
          <Text fz="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            Ya sea que quieras hacer nuevos amigos, aprender algo nuevo o simplemente pasar el rato, aquí encontrarás la <strong style={{ color: '#374151' }}>forma</strong> más fácil de acceder a las mejores comunidades. Incluso si vienes desde <strong style={{ color: '#374151' }}>Google</strong>, te damos la bienvenida a JoinGroups.
          </Text>
        </Box>

        <Box mt="lg">
          <Button
            radius="xl"
            component={Link}
            href="/clanes/clanes-de-clash-royale"
            variant="light"
            color="violet"
            size="sm"
          >
            Ver clanes de Clash Royale
          </Button>
        </Box>


        {/* ── WhatsApp Support Button ── */}
        <Button
          variant="subtle"
          color="gray"
          mt="xl"
          component="a"
          href="https://wa.me/5218261308623?text=Hola,%20quisiera%20sugerir%20un%20cambio%20para%20la%20pagina%20de%20JoinGroups"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          radius="md"
          size="sm"
          style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 400 }}
        >
          {t('¿Tienes problemas? O quisieras sugerir un cambio en la página? Escríbenos por WhatsApp')}
        </Button>


        {/* ── Floating Publish Button ── */}
        <Button
          radius="xl"
          component={Link}
          href="/comunidades/subir-grupo"
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            border: 'none',
            fontWeight: 600,
            ...floatingStyle(buttonPosition),
          }}
          className={styles['floating-publish-button']}
        >
          {t('Publica tu grupo GRATIS !!')}
        </Button>

      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const snapshot = await getDocs(collection(db, 'groups'));
  const groups = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
  }));

  const destacados = groups.filter(g => g.destacado);
  const normales = groups.filter(g => !g.destacado);

  return {
    props: { serverData: [...destacados, ...normales] },
  };
}
