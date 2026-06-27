'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection, query, where, getDocs,
  limit, runTransaction, updateDoc
} from 'firebase/firestore';
import { Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconExternalLink,
  IconEye,
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

const asText = (value) => Array.isArray(value) ? value[0] : value;

const DESKTOP_GROUP_AD = {
  key: '13ffd663b16098ca0ab4303c93202549',
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

const getAdScriptSrc = (key) => `https://landslidegraphsystems.com/${key}/invoke.js`;

function GroupAdSlot() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof window === 'undefined') return undefined;

    const adConfig = window.matchMedia('(max-width: 720px)').matches
      ? MOBILE_GROUP_AD
      : DESKTOP_GROUP_AD;

    mount.innerHTML = '';
    window.atOptions = { ...adConfig };

    const script = document.createElement('script');
    script.src = getAdScriptSrc(adConfig.key);
    script.async = true;
    script.dataset.groupAd = adConfig.key;
    mount.appendChild(script);

    return () => {
      script.remove();
      mount.innerHTML = '';
    };
  }, []);

  return (
    <div className={classes.adFrame}>
      <div ref={mountRef} className={classes.adMount} />
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

  if (loading) return <div className={classes.loadingState}>{t('Cargando...')}</div>;
  if (notFound || !group) return <div className={classes.loadingState}>{t('Grupo no encontrado.')}</div>;

  const baseLang = i18n.language.split('-')[0];
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
                {categoryList.slice(0, 2).map((cat) => (
                  <span className={classes.catBadge} key={cat}>{cat}</span>
                ))}
                {group.content18 && (
                  <span className={`${classes.catBadge} ${classes.badge18}`}>+18</span>
                )}
                {group.city && (
                  <span className={`${classes.catBadge} ${classes.flagBadge}`} title={group.city}>
                    {countryMap[group.city] || group.city}
                  </span>
                )}
              </div>
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
          </div>
        </section>

        <section className={classes.card}>
          <div className={classes.sectionLabel}>{t('Descripción:')}</div>
          <p className={classes.desc}>{description}</p>

          <div className={classes.sep} />

          <div className={classes.categoryList}>
            {categoryList.length > 0 ? (
              categoryList.map((cat) => (
                <span className={classes.catBadge} key={cat}>{cat}</span>
              ))
            ) : (
              <span className={classes.catBadge}>{t('Sin categoría')}</span>
            )}
          </div>
        </section>

        <section className={classes.adSection} aria-label={t('Publicidad')}>
          <div className={classes.adLabel}>{t('Publicidad')}</div>
          <div className={classes.adStack}>
            <GroupAdSlot />
            <GroupAdSlot />
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
