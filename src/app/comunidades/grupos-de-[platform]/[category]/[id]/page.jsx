'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection, query, where, getDocs,
  limit, updateDoc, increment
} from 'firebase/firestore';
import { Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconCalendar,
  IconExternalLink,
  IconEye,
  IconMapPin,
  IconTags,
} from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import classes from '@/app/styles/GroupDetail.module.css';

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

const countryNameMap = {
  mx: 'México',
  us: 'Estados Unidos',
  ar: 'Argentina',
  co: 'Colombia',
  es: 'España',
  pe: 'Perú',
  cl: 'Chile',
  ve: 'Venezuela',
  br: 'Brasil',
  ec: 'Ecuador',
  gt: 'Guatemala',
  bo: 'Bolivia',
  do: 'República Dominicana',
  hn: 'Honduras',
  py: 'Paraguay',
  sv: 'El Salvador',
  ni: 'Nicaragua',
  cr: 'Costa Rica',
  pa: 'Panamá',
  uy: 'Uruguay',
  pr: 'Puerto Rico',
  ca: 'Canadá',
  de: 'Alemania',
  fr: 'Francia',
  it: 'Italia',
  gb: 'Reino Unido',
  nl: 'Países Bajos',
  pt: 'Portugal',
  jp: 'Japón',
  kr: 'Corea del Sur',
  cn: 'China',
  in: 'India',
  ru: 'Rusia',
  au: 'Australia',
};

const asText = (value) => Array.isArray(value) ? value[0] : value;

const isAdultValue = (value) => ['sí', 'si', 'yes', 'true'].includes(String(value || '').trim().toLowerCase());

const formatCreatedAt = (value, lang) => {
  if (!value) return 'Reciente';

  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Reciente';

  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const DESKTOP_GROUP_AD = {
  key: '13ffd663b16098ca0ab4303c93202649',
  format: 'iframe',
  height: 90,
  width: 728,
  params: {},
};

const MOBILE_GROUP_AD = {
  key: 'fc0b1b6a0a12b2d01753d9df1328a017',
  format: 'iframe',
  height: 60,
  width: 468,
  params: {},
};

const MIN_HORIZONTAL_AD_SCALE = 0.8;

const getAdScriptSrc = (key) => `https://landslidegraphsystems.com/${key}/invoke.js`;

const getBestAdConfig = (availableWidth, isMobile) => {
  if (!isMobile) return DESKTOP_GROUP_AD;
  return MOBILE_GROUP_AD;
};

const buildAdSrcDoc = (config) => `<!doctype html>
<html>
  <head>
    <base target="_blank" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <script>window.atOptions = ${JSON.stringify(config)};<\/script>
    <script src="${getAdScriptSrc(config.key)}"><\/script>
  </body>
</html>`;

function GroupAdSlot({ slotId }) {
  const mountRef = useRef(null);
  const [adState, setAdState] = useState(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 720px)');

    const syncAdSize = () => {
      const isMobile = mobileQuery.matches;
      const fallbackWidth = isMobile ? MOBILE_GROUP_AD.width : DESKTOP_GROUP_AD.width;
      const availableWidth = mountRef.current?.clientWidth || fallbackWidth;
      const config = getBestAdConfig(availableWidth, isMobile);
      const scale = Math.min(1, availableWidth / config.width);

      setAdState({ config, scale });
    };

    syncAdSize();
    mobileQuery.addEventListener('change', syncAdSize);
    window.addEventListener('resize', syncAdSize);

    let resizeObserver;
    if ('ResizeObserver' in window && mountRef.current) {
      resizeObserver = new ResizeObserver(syncAdSize);
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      mobileQuery.removeEventListener('change', syncAdSize);
      window.removeEventListener('resize', syncAdSize);
      resizeObserver?.disconnect();
    };
  }, []);

  const config = adState?.config;
  const scale = adState?.scale || 1;
  const frameHeight = config ? Math.max(48, Math.ceil(config.height * scale)) : DESKTOP_GROUP_AD.height;

  return (
    <div className={classes.adFrame} style={{ '--ad-frame-height': `${frameHeight}px` }}>
      <div ref={mountRef} className={classes.adMount}>
        {config && (
          <iframe
            className={classes.adIframe}
            title={`Publicidad ${slotId}`}
            srcDoc={buildAdSrcDoc(config)}
            scrolling="no"
            style={{
              width: config.width,
              height: config.height,
              transform: `scale(${scale})`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function GroupDetail() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const id = asText(params?.id);
  const platform = asText(params?.platform);
  const category = asText(params?.category);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const q = query(
          collection(db, 'groups'),
          where('slug', '==', id),
          limit(1)
        );
        let snap = await getDocs(q);

        if (snap.empty) {
          const allQ = query(collection(db, 'groups'), limit(1000));
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

        const resolvedGroup = { id: docSnap.id, ...data, slug: data.slug || slugify(data.name) };
        const visitKey = `visitado-${id}`;
        const yaVisitado = sessionStorage.getItem(visitKey);

        if (!yaVisitado) {
          try {
            await updateDoc(docRef, { visitas: increment(1) });
            resolvedGroup.visitas = (resolvedGroup.visitas || 0) + 1;
            sessionStorage.setItem(visitKey, 'true');
          } catch (visitErr) {
            console.warn('No se pudo actualizar visitas del grupo', visitErr);
          }
        }

        setGroup(resolvedGroup);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  if (loading) return <div className={classes.loadingState}>{t('Cargando...')}</div>;
  if (notFound || !group) return <div className={classes.loadingState}>{t('Grupo no encontrado.')}</div>;

  const baseLang = (i18n.language || 'es').split('-')[0];
  const platformSlug = (platform || group?.tipo || 'telegram').toLowerCase().replace('grupos-de-', '');
  const isWhatsapp = platformSlug === 'whatsapp';
  const platformName = isWhatsapp ? 'WhatsApp' : 'Telegram';
  const platformKey = isWhatsapp ? 'Whatsapp' : 'Telegram';
  const platformIcon = isWhatsapp ? <IconBrandWhatsapp size={26} /> : <IconBrandTelegram size={26} />;
  const categoryList = Array.isArray(group.categories) && group.categories.length > 0
    ? group.categories
    : category
      ? [category]
      : [];
  const description = group.description && typeof group.description === 'object'
    ? group.description[baseLang] || group.description.es || group.description.en || t('Sin descripción')
    : group.description || t('Sin descripción');
  const isAdultContent = isAdultValue(group.content18);
  const contentLabel = isAdultContent ? '+18' : 'Apto para todos';
  const countryFlag = countryMap[group.city] || '🌐';
  const countryLabel = countryNameMap[group.city] || group.city || 'Global';
  const createdLabel = formatCreatedAt(group.createdAt, baseLang);
  const communityType = isWhatsapp
    ? String(group.link || '').includes('/channel/') ? 'Canal' : 'Grupo'
    : 'Grupo';
  const categoryText = categoryList.length > 0 ? categoryList.join(', ') : 'General';

  const openGroupLink = () => {
    if (!group.link) return;

    const isChromeMobile =
      typeof navigator !== 'undefined' &&
      /Chrome/.test(navigator.userAgent) &&
      /Android/.test(navigator.userAgent) &&
      !/OPR|Edge/.test(navigator.userAgent);

    if (isChromeMobile) {
      window.location.replace(group.link);
      return;
    }

    const a = document.createElement('a');
    a.href = group.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <main className={classes.pageBg}>
      <div className={classes.wrapper}>
        <section className={classes.hero}>
          <div className={classes.heroBorder} />
          <div className={classes.heroBody}>
            <div className={`${classes.heroIcon} ${isWhatsapp ? classes.heroIconWhatsapp : classes.heroIconTelegram}`}>
              {platformIcon}
            </div>

            <div className={classes.heroText}>
              <h1 className={classes.groupName}>{group.name}</h1>
              <div className={classes.heroBadges}>
                <span className={`${classes.platformBadge} ${isWhatsapp ? classes.platformWhatsapp : classes.platformTelegram}`}>
                  {platformName}
                </span>
                {categoryList.slice(0, 3).map((cat) => (
                  <span className={classes.catBadge} key={cat}>{cat}</span>
                ))}
                {isAdultContent && (
                  <span className={`${classes.catBadge} ${classes.badge18}`}>+18</span>
                )}
                <span className={`${classes.catBadge} ${classes.flagBadge}`} title={countryLabel}>
                  {countryFlag}
                </span>
              </div>
              <p className={classes.heroIntro}>
                {communityType} de {platformName} en {categoryText}
              </p>
            </div>
          </div>

          <div className={classes.statsStrip}>
            <div className={classes.statCell}>
              <span className={classes.statVal}>
                <IconEye size={17} />
                {group.visitas || 0}
              </span>
              <span className={classes.statLbl}>{t('Vistas')}</span>
            </div>
            <div className={classes.statCell}>
              <span className={classes.statVal}>{categoryList.length || 1}</span>
              <span className={classes.statLbl}>{t('Categorías')}</span>
            </div>
            <div className={classes.statCell}>
              <span className={classes.statVal}>{countryFlag}</span>
              <span className={classes.statLbl}>Ubicación</span>
            </div>
            <div className={classes.statCell}>
              <span className={`${classes.statVal} ${isAdultContent ? classes.statValAdult : classes.statValSafe}`}>
                {contentLabel}
              </span>
              <span className={classes.statLbl}>Contenido</span>
            </div>
          </div>
        </section>


        <section className={`${classes.card} ${classes.profileCard}`}>
          <div className={classes.profileHeader}>
            <div className={classes.profileTitleBlock}>
              <div className={classes.profileEyebrow}>Comunidad</div>
              <h2 className={classes.profileTitle}>{group.name}</h2>
            </div>
            <span className={`${classes.contentPill} ${isAdultContent ? classes.contentPillAdult : ''}`}>
              {contentLabel}
            </span>
          </div>

          <p className={classes.profileDesc}>{description}</p>

          <div className={classes.detailGrid}>
            <div className={classes.detailItem}>
              <span className={`${classes.detailIcon} ${isWhatsapp ? classes.detailIconWhatsapp : classes.detailIconTelegram}`}>
                {platformIcon}
              </span>
              <div className={classes.detailCopy}>
                <span className={classes.detailLabel}>Plataforma</span>
                <strong>{communityType} de {platformName}</strong>
              </div>
            </div>
            <div className={classes.detailItem}>
              <span className={classes.detailIcon}><IconTags size={16} /></span>
              <div className={classes.detailCopy}>
                <span className={classes.detailLabel}>Categoría principal</span>
                <strong>{categoryList[0] || 'General'}</strong>
              </div>
            </div>
            <div className={classes.detailItem}>
              <span className={classes.detailIcon}><IconMapPin size={16} /></span>
              <div className={classes.detailCopy}>
                <span className={classes.detailLabel}>País</span>
                <strong>{countryFlag} {countryLabel}</strong>
              </div>
            </div>
            <div className={classes.detailItem}>
              <span className={classes.detailIcon}><IconCalendar size={16} /></span>
              <div className={classes.detailCopy}>
                <span className={classes.detailLabel}>Publicado</span>
                <strong>{createdLabel}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={classes.adSection} aria-label={t('Publicidad')}>
          <div className={classes.adLabel}>{t('Publicidad')}</div>
          <div className={classes.adStack}>
            <GroupAdSlot slotId="1" />
            <GroupAdSlot slotId="2" />
          </div>
        </section>

        <section className={classes.actionPanel}>
          <button
            type="button"
            className={`${classes.joinBtn} ${!group.link ? classes.joinBtnDisabled : ''}`}
            disabled={!group.link}
            onClick={openGroupLink}
          >
            <IconExternalLink size={17} />
            {group.link ? t(`${platformKey} - ACCEDER AL GRUPO`) : t('Enlace no disponible')}
          </button>

          <button type="button" className={classes.reportBtn} onClick={open}>
            <IconAlertTriangle size={12} />
            {t('Reportar Enlace roto')}
          </button>
        </section>
        <Modal
          centered
          opened={opened}
          onClose={() => {
            close();
            setReportText('');
            setSent(false);
          }}
          title={<span className={classes.modalTitle}>{t('Reportar Enlace roto')}</span>}
          styles={{
            content: { borderRadius: 18, border: '1px solid #F0F0F0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' },
            header: { borderBottom: '1px solid #F5F5F5', padding: '1.15rem 1.35rem' },
          }}
        >
          {!sent ? (
            <div className={classes.reportForm}>
              <p className={classes.modalHelp}>
                {t('Describe brevemente el problema (mín. 10 y máx. 200 caracteres):')}
              </p>
              <textarea
                className={classes.reportTextarea}
                maxLength={200}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder={t('Ej. El enlace lleva a un grupo equivocado o ya no existe.')}
              />
              <div className={classes.reportCharCount}>
                {reportText.length} / 200
                {reportText.length > 0 && reportText.length < 10 && ` - ${t('Demasiado corto')}`}
              </div>

              <div className={classes.reportActions}>
                <button
                  type="button"
                  className={classes.cancelBtn}
                  onClick={() => {
                    close();
                    setReportText('');
                    setSent(false);
                  }}
                >
                  {t('Cancelar')}
                </button>
                <button
                  type="button"
                  className={classes.submitReportBtn}
                  disabled={reportText.trim().length < 10 || sending}
                  onClick={async () => {
                    setSending(true);
                    await sendTelegramMessage('Enlace roto', reportText.trim());
                    setSending(false);
                    setReportText('');
                    setSent(true);
                  }}
                >
                  {sending ? t('Enviando...') : t('Enviar reporte')}
                </button>
              </div>
            </div>
          ) : (
            <div className={classes.reportSuccess}>
              {t('¡Se ha enviado el mensaje y, sera revisado pronto ¡Gracias por tu ayuda!')}
            </div>
          )}
        </Modal>
      </div>
    </main>
  );

  async function sendTelegramMessage(tipo, mensaje = '') {
    const chatId = -1002622285468;
    const token = "7551745963:AAFiTkb9UehxZMXNINihI8wSdlTMjaM6Lfk";

    const text = `🚨 *Nuevo reporte: ${tipo}*\n` +
      `Grupo: ${group?.name}\n` +
      `URL: ${window.location.href}\n` +
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
