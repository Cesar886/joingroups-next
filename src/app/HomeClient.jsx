"use client";
import {
  ActionIcon,
  Title,
  Text,
  Button,
  Container,
  Stack,
  Group,
  Box,
  Menu,
  Center,
  Divider,
  rem,
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
import { useRouter } from 'next/navigation';
import '@/locales/i18n';



const countries = [
  { value: 'mx', label: 'México', emoji: '🇲🇽', lang: 'es' },
  { value: 'us', label: 'Estados Unidos', emoji: '🇺🇸', lang: 'en' },
  { value: 'ar', label: 'Argentina', emoji: '🇦🇷', lang: 'es' },
  { value: 'co', label: 'Colombia', emoji: '🇨🇴', lang: 'es' },
  { value: 'es', label: 'España', emoji: '🇪🇸', lang: 'es' },
  { value: 'pe', label: 'Perú', emoji: '🇵🇪', lang: 'es' },
  { value: 'cl', label: 'Chile', emoji: '🇨🇱', lang: 'es' },
  { value: 've', label: 'Venezuela', emoji: '🇻🇪', lang: 'es' },
  { value: 'br', label: 'Brasil', emoji: '🇧🇷', lang: 'pt' },
  { value: 'ec', label: 'Ecuador', emoji: '🇪🇨', lang: 'es' },
  { value: 'gt', label: 'Guatemala', emoji: '🇬🇹', lang: 'es' },
  { value: 'bo', label: 'Bolivia', emoji: '🇧🇴', lang: 'es' },
  { value: 'do', label: 'República Dominicana', emoji: '🇩🇴', lang: 'es' },
  { value: 'hn', label: 'Honduras', emoji: '🇭🇳', lang: 'es' },
  { value: 'py', label: 'Paraguay', emoji: '🇵🇾', lang: 'es' },
  { value: 'sv', label: 'El Salvador', emoji: '🇸🇻', lang: 'es' },
  { value: 'ni', label: 'Nicaragua', emoji: '🇳🇮', lang: 'es' },
  { value: 'cr', label: 'Costa Rica', emoji: '🇨🇷', lang: 'es' },
  { value: 'pa', label: 'Panamá', emoji: '🇵🇦', lang: 'es' },
  { value: 'uy', label: 'Uruguay', emoji: '🇺🇾', lang: 'es' },
  { value: 'pr', label: 'Puerto Rico', emoji: '🇵🇷', lang: 'es' },
  { value: 'ca', label: 'Canadá', emoji: '🇨🇦', lang: 'en' },
  { value: 'de', label: 'Alemania', emoji: '🇩🇪', lang: 'de' },
  { value: 'fr', label: 'Francia', emoji: '🇫🇷', lang: 'fr' },
  { value: 'it', label: 'Italia', emoji: '🇮🇹', lang: 'it' },
  { value: 'gb', label: 'Reino Unido', emoji: '🇬🇧', lang: 'en' },
  { value: 'nl', label: 'Países Bajos', emoji: '🇳🇱', lang: 'nl' },
  { value: 'pt', label: 'Portugal', emoji: '🇵🇹', lang: 'pt' },
  { value: 'jp', label: 'Japón', emoji: '🇯🇵', lang: 'ja' },
  { value: 'kr', label: 'Corea del Sur', emoji: '🇰🇷', lang: 'ko' },
  { value: 'cn', label: 'China', emoji: '🇨🇳', lang: 'zh' },
  { value: 'in', label: 'India', emoji: '🇮🇳', lang: 'hi' },
  { value: 'ru', label: 'Rusia', emoji: '🇷🇺', lang: 'ru' },
  { value: 'au', label: 'Australia', emoji: '🇦🇺', lang: 'en' },
];

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
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [clanes, setClanes] = useState([]);
  const [subdomain, setSubdomain] = useState('mx');
  const baseLang = typeof i18n.language === 'string' ? i18n.language.split('-')[0] : 'es';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [buttonPosition, setButtonPosition] = useState('top-left');
  const positionRef = useRef('top-left');
  const [groupsTelegram, setGroupsTelegram] = useState([]);
  const [groupsWhatsapp, setGroupsWhatsapp] = useState([]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const sd = host.includes('.') ? host.split('.')[0] : 'mx';
      setSubdomain(sd);
    }
  }, []);


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
      setGroupsWhatsapp([...destacadosWhatsapp, ...nuevosWhatsapp].slice(0, 5));

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
        ? row.description[baseLang] || row.description[i18n.language] || row.description['es']
        : row.description;

    const handleClick = () => {
      const categoria = row.categories?.[0] || 'otros';
      const basePath = isGroup
        ? `/comunidades/grupos-de-${row.tipo}/${slugify(categoria)}`
        : `/clanes/clanes-de-${row.tipo}`;
      router.push(`${basePath}/${slug}`);
    };

    return (
      <div key={`${row.id}-${idx}`}>
        <div className={styles.groupRow} onClick={handleClick}>
          <img src={iconSrc} alt={row.name} className={styles.groupIcon} />
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
        </div>
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
      <Container size="lg" py="md" className={styles.mobileContainerFix}>

        {/* ── Hero ── */}
        <Stack align="center" spacing="md" px="md" mt="xl" mb="lg">
          <Title
            order={1}
            ta="center"
            fw={800}
            fz={isMobile ? 26 : 40}
            lh={1.15}
            style={{ letterSpacing: '-0.02em' }}
          >
            <span className={styles.heroGradientText}>
              {isMobile
                ? 'Grupos de Telegram, WhatsApp y Juegos'
                : 'Los mejores Grupos de Telegram,\nWhatsApp y Clanes Activos'}
            </span>
          </Title>

          <Text ta="center" fz={isMobile ? 'sm' : 'md'} maw={580} mx="auto"
            style={{ color: '#6B7280', lineHeight: 1.65 }}>
            {isMobile
              ? 'Únete a comunidades en Telegram, WhatsApp y juegos populares.'
              : <>
                  En <strong style={{ color: '#374151' }}>JoinGroups.pro</strong> puedes unirte fácilmente a comunidades
                  populares en <strong style={{ color: '#374151' }}>Telegram</strong>, <strong style={{ color: '#374151' }}>WhatsApp</strong> y
                  juegos como <strong style={{ color: '#374151' }}>Clash Royale</strong>. Explora grupos por temas, idiomas y más.
                </>
            }
          </Text>

          <Button
            size="md"
            component={Link}
            href="/comunidades"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              border: 'none',
              fontWeight: 600,
              fontSize: '14.5px',
              padding: '0 24px',
              height: 44,
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.35)';
            }}
          >
            {t('Explorar Grupos Populares')}
          </Button>
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
        <Box mt="xl" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.badgeClanes}`}>
              <IconCrown size={11} />
              Clanes
            </span>
            <Title order={2} fz={isMobile ? 17 : 20} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
              {isMobile ? 'Clanes destacados' : 'Clanes destacados y con más vistas'}
            </Title>
          </div>

          <div style={{ padding: '0 8px 8px' }}>
            {clanes.map((clan, i) => renderCard(clan, i, false))}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Button
              variant="subtle"
              component={Link}
              href="/clanes"
              color="violet"
              size="sm"
              radius="md"
              rightSection={<IconChevronRight size={14} />}
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              Ver todos los clanes
            </Button>
          </div>
        </Box>


        {/* ── Telegram Section ── */}
        <Box mt="lg" className={styles.sectionCard}>
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

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
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
          </div>
        </Box>


        {/* ── WhatsApp Section ── */}
        <Box mt="lg" className={styles.sectionCard}>
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
            Publica tu CLAN ahora
          </Button>
        </Center>


        {/* ── Country Selector ── */}
        <Box
          mt="xl"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <Menu shadow="md" width={200} withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon
                size="lg"
                radius="xl"
                variant="subtle"
                style={{ fontSize: rem(24), display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '16px', display: 'inline-block', lineHeight: '1', borderRadius: '2px', overflow: 'hidden', width: '20px', height: '14px' }}>
                  {countries.find((c) => c.value === subdomain)?.emoji ?? '🇲🇽'}
                </span>
                <span style={{ fontSize: '0.75rem', transform: 'translateY(1px)' }}>▼</span>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown
              style={{ maxHeight: rem(300), overflowY: 'auto' }}
              onWheel={(e) => e.stopPropagation()}
            >
              {countries.map((country) => (
                <Menu.Item
                  key={country.value}
                  leftSection={
                    <span style={{ fontSize: '16px', display: 'inline-block', lineHeight: '1', borderRadius: '2px', overflow: 'hidden', width: '20px', height: '14px' }}>
                      {country.emoji}
                    </span>
                  }
                  onClick={() => {
                    const currentPath = window.location.pathname + window.location.search;
                    i18n.changeLanguage(country.lang);
                    window.location.href = `https://${country.value}.joingroups.pro${currentPath}`;
                  }}
                >
                  {country.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Box>


        {/* ── SEO Content ── */}
        <Box mt="lg" className={styles.seoSection} mx="auto">
          <Divider mb="lg" style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
          <Title order={2} mb="md" fz={isMobile ? 18 : 22} fw={700} style={{ letterSpacing: '-0.01em', color: '#0F0F14' }}>
            Únete a los mejores grupos y canales de Telegram, WhatsApp y más
          </Title>

          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            ¿Quieres encontrar un <strong style={{ color: '#374151' }}>grupo</strong> o <strong style={{ color: '#374151' }}>canal</strong> activo en <strong style={{ color: '#374151' }}>Telegram</strong>, <strong style={{ color: '#374151' }}>WhatsApp</strong> o incluso juegos? En <strong style={{ color: '#374151' }}>JoinGroups</strong> puedes <strong style={{ color: '#374151' }}>descubrir, conocer</strong> y unirte fácilmente a miles de <strong style={{ color: '#374151' }}>grupos</strong> clasificados por temática, país y número de <strong style={{ color: '#374151' }}>miembros</strong>.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            Nuestra plataforma te ayuda a encontrar <strong style={{ color: '#374151' }}>canales</strong> de calidad en categorías como anime, música, desarrollo, amistad, NSFW, salud, IA, memes y más. Todos los <strong style={{ color: '#374151' }}>grupos</strong> son verificados y contienen contenido actualizado.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            <strong style={{ color: '#374151' }}>JoinGroups</strong> ha sido diseñado para que <strong style={{ color: '#374151' }}>puedas</strong> navegar rápidamente, desde cualquier dispositivo, ya sea <strong style={{ color: '#374151' }}>Android</strong> o PC. Utiliza nuestros filtros inteligentes por idioma, país o tipo de <strong style={{ color: '#374151' }}>contenido</strong> para encontrar exactamente lo que buscas.
          </Text>
          <Text fz="sm" mb="sm" style={{ color: '#6B7280', lineHeight: 1.75 }}>
            Si eres creador, también puedes <strong style={{ color: '#374151' }}>crear</strong> tu propio <strong style={{ color: '#374151' }}>grupo</strong> y publicarlo gratis. Miles de <strong style={{ color: '#374151' }}>usuarios</strong> buscan comunidades nuevas cada día, así que no pierdas la oportunidad de hacer crecer la tuya.
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
          href="https://wa.me/5212284935831?text=Hola,%20quisiera%20sugerir%20un%20cambio%20para%20la%20pagina%20de%20JoinGroups"
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
