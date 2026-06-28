'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  collection, addDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useRef, useState } from 'react';
import slugify from '@/lib/slugify';
import { logPublication, shouldBypassCaptchaInDev } from '@/lib/publicationDebug';
import { useTranslation } from 'react-i18next';
import { useForm } from '@mantine/form';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import {
  IconShield, IconLink, IconMail, IconAlignLeft,
  IconCheck, IconX, IconSend, IconMessageCircle,
} from '@tabler/icons-react';
import classes from '@/app/styles/PublicarClan.module.css';

const API_URL = '';

export default function ClanesGroupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const baseLang = i18n.language.split('-')[0];
  const [game, setGame] = useState('Clash Royale');

  const clashRoyaleClanRegex = /^https:\/\/link\.clashroyale\.com\/invite\/clan\//i;
  const clashOfClansClanRegex = /^https:\/\/link\.clashofclans\.com\/.+tag=/i;

  const form = useForm({
    initialValues: {
      name: '',
      link: '',
      email: '',
      emailRepeat: '',
      descriptionEs: '',
      descriptionEn: '',
      categories: '',
      content18: '',
      acceptTerms: false,
    },
    validate: {
      email: (v) => /^\S+@\S+\.\S+$/.test(v) ? null : t('Email inválido'),
      emailRepeat: (v, vals) => v === vals.email ? null : t('Los emails no coinciden'),
      acceptTerms: (v) => v ? null : t('Debes aceptar los términos'),
      descriptionEs: (v, values) => {
        const lenEs = v.trim().length;
        const lenEn = values.descriptionEn.trim().length;
        return (lenEs >= 20 && lenEs <= 320) || (lenEn >= 20 && lenEn <= 320)
          ? null : t('Debes escribir una descripción en español o en inglés (20–320 caracteres)');
      },
      descriptionEn: (v, values) => {
        const lenEn = v.trim().length;
        const lenEs = values.descriptionEs.trim().length;
        return (lenEn >= 20 && lenEn <= 320) || (lenEs >= 20 && lenEs <= 320)
          ? null : t('You must write a description in English or Spanish (20–320 characters)');
      },
      categories: (v) => v && v.length > 0 ? null : t('Debes seleccionar una categoría'),
      link: (v) => {
        const val = v.trim();
        if (game === 'Clash Royale' && !clashRoyaleClanRegex.test(val))
          return t('El enlace de invitación de Clash Royale no es válido');
        if (game === 'Clash of Clans' && !clashOfClansClanRegex.test(val))
          return t('El enlace de invitación de Clash of Clans no es válido');
        return null;
      },
    },
  });

  const captchaRef = useRef(null);
  const submittingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const DEEPL_PROXY_URL = 'https://daniel-rdz.tech/translate';

  async function translateText(text, source, target) {
    if (shouldBypassCaptchaInDev()) return '';

    try {
      const res = await fetch(DEEPL_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, target }),
      });
      if (!res.ok) return '';
      const data = await res.json();
      return data.translated;
    } catch { return ''; }
  }

  const useDebouncedCallback = (callback, delay = 800) => {
    const timeout = useRef(null);
    return (...args) => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => callback(...args), delay);
    };
  };

  const debouncedTranslate = useDebouncedCallback(async () => {
    const { descriptionEs, descriptionEn } = form.values;
    if (baseLang === 'es' && descriptionEs.trim().length >= 20 && !descriptionEn.trim()) {
      form.setFieldValue('descriptionEn', await translateText(descriptionEs, 'ES', 'EN'));
    }
    if (baseLang === 'en' && descriptionEn.trim().length >= 20 && !descriptionEs.trim()) {
      form.setFieldValue('descriptionEs', await translateText(descriptionEn, 'EN', 'ES'));
    }
  }, 900);

  const resetCaptcha = () => {
    captchaRef.current?.resetCaptcha?.();
  };

  const handleCaptchaError = () => {
    logPublication('clan', 'captcha_error', { game, link: form.values.link });
    resetCaptcha();
    setModalOpen(false);
    showNotification({
      title: t('Error de verificación'),
      message: t('No se pudo completar el captcha. Inténtalo de nuevo.'),
      color: 'red',
    });
  };

  const handleCaptchaExpire = () => {
    logPublication('clan', 'captcha_expired', { game, link: form.values.link });
    resetCaptcha();
    showNotification({
      title: t('Captcha expirado'),
      message: t('Vuelve a verificar que no eres un bot.'),
      color: 'yellow',
    });
  };

  const handleVerify = async (token) => {
    if (!token || submittingRef.current) return;

    submittingRef.current = true;
    setModalOpen(false);
    setIsLoading(true);

    try {
      const rawLink = form.values.link.trim();
      await logPublication('clan', 'publish_started', { game, link: rawLink });
      const url = new URL(rawLink);
      let tag = new URLSearchParams(url.search).get('tag') || '';
      if (!tag) {
        await logPublication('clan', 'tag_missing', { game, link: rawLink });
        showNotification({ title: t('Error al extraer tag'), message: t('No se pudo extraer el tag del enlace'), color: 'red' });
        return;
      }
      tag = tag.replace(/^%23/, '').replace(/^#/, '').toUpperCase();
      const encodedTag = encodeURIComponent(`#${tag}`);
      await logPublication('clan', 'clash_lookup_started', { game, tag });
      const res = await fetch(`${API_URL}/api/clash?tag=${encodedTag}&type=full`);
      if (!res.ok) {
        await logPublication('clan', 'clash_lookup_failed', { game, tag, status: res.status });
        throw new Error(t('No se pudo validar el clan. Inténtalo de nuevo.'));
      }
      const data = await res.json();
      const clanName = data?.info?.name?.trim() || data?.name?.trim() || '';
      if (!clanName) {
        await logPublication('clan', 'clan_name_missing', { game, tag });
        showNotification({ title: t('Error al obtener clan'), message: t('No se pudo obtener el nombre del clan.'), color: 'red' });
        return;
      }
      const slug = slugify(clanName);
      const gameSlug = game.toLowerCase().replace(/\s+/g, '-');
      const { descriptionEs, descriptionEn, ...plainValues } = form.values;
      const docRef = await addDoc(collection(db, 'clanes'), {
        ...plainValues,
        juego: gameSlug,
        tag: `%23${tag}`,
        name: clanName,
        slug,
        link: rawLink,
        description: { es: descriptionEs.trim(), en: descriptionEn.trim() },
        destacado: false,
        visitas: 0,
        createdAt: new Date(),
        tipo: gameSlug,
        translationPending: !descriptionEs.trim() || !descriptionEn.trim(),
      });
      showNotification({ title: t('¡Éxito!'), message: t('Clan publicado correctamente'), color: 'green' });
      if (!descriptionEs.trim() || !descriptionEn.trim()) {
        const text = descriptionEs.trim() || descriptionEn.trim();
        const source = descriptionEs.trim() ? 'ES' : 'EN';
        const target = descriptionEs.trim() ? 'EN' : 'ES';
        let attempts = 0;
        const intervalId = setInterval(async () => {
          attempts++;
          try {
            const translated = await translateText(text, source, target);
            if (translated && translated.length >= 20) {
              await updateDoc(docRef, { [`description.${target.toLowerCase()}`]: translated, translationPending: false });
              clearInterval(intervalId);
            }
          } catch (e) { console.warn(e); }
          if (attempts > 60) clearInterval(intervalId);
        }, 5000);
      }
      const destination = `/clanes/clanes-de-${gameSlug}/${slug}`;
      await logPublication('clan', 'publish_success', { id: docRef.id, slug, tag, destination });
      form.reset();
      router.push(destination);
    } catch (error) {
      console.error(error);
      await logPublication('clan', 'publish_error', {
        code: error?.code,
        message: error?.message || String(error),
      });
      showNotification({
        title: t('Error'),
        message: error?.message || t('No se pudo guardar. Inténtalo de nuevo.'),
        color: 'red',
      });
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
      resetCaptcha();
    }
  };

  const isLinkValid =
    (game === 'Clash Royale' && clashRoyaleClanRegex.test(form.values.link.trim())) ||
    (game === 'Clash of Clans' && clashOfClansClanRegex.test(form.values.link.trim()));

  const descLen = baseLang === 'es' ? form.values.descriptionEs.length : form.values.descriptionEn.length;

  return (
    <>
      <Head>
        <title>{`Publicar Clan de ${game} | Gratis en JoinGroups 2025`}</title>
        <meta name="description" content={`Envía tu clan de ${game} para ser listado en nuestro directorio verificado.`} />
        <link rel="canonical" href="https://joingroups.pro/clanes/publicar-clan" />
      </Head>

      <div className={classes.pageBg}>
        <div className={classes.wrapper}>

          {/* Header */}
          <div className={classes.header}>
            <div className={classes.eyebrow}>
              <span className={classes.eyebrowDot} />
              Directorio verificado
            </div>
            <h1 className={classes.pageTitle}>{t('Publica tu Clan')}</h1>
            <p className={classes.pageSub}>
              Tu clan aparecerá en el directorio público de JoinGroups en minutos.
            </p>
          </div>

          {/* Suggestion banner */}
          <a
            href="https://wa.me/5212284935831?text=Hola%2C%20me%20gustaría%20sugerir%20un%20nuevo%20juego%20para%20los%20clanes%20en%20JoinGroups"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.suggestionBanner}
          >
            <div className={classes.suggestionIcon}>
              <IconMessageCircle size={17} />
            </div>
            <div className={classes.suggestionText}>
              <strong>¿Quieres otro juego?</strong>
              Comunícate con nosotros para sugerirlo
            </div>
          </a>

          {/* Form card */}
          <div className={classes.card}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isLoading) return;

                const validation = form.validate();
                if (validation.hasErrors) {
                  logPublication('clan', 'validation_failed', {
                    game,
                    link: form.values.link,
                    errors: validation.errors,
                  });
                  return;
                }

                const bypassCaptcha = shouldBypassCaptchaInDev();
                logPublication('clan', 'submit_valid', {
                  game,
                  link: form.values.link,
                  captchaBypassed: bypassCaptcha,
                });

                if (bypassCaptcha) {
                  logPublication('clan', 'captcha_bypassed_local_dev', { game, link: form.values.link });
                  handleVerify('local-dev-bypass');
                  return;
                }

                resetCaptcha();
                setModalOpen(true);
              }}
            >
              {/* Game selector */}
              <div className={classes.sectionLabel}>Juego</div>
              <div className={classes.gameSelector}>
                {['Clash Royale', 'Clash of Clans'].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`${classes.gameBtn} ${game === g ? classes.gameBtnActive : ''}`}
                    onClick={() => setGame(g)}
                  >
                    <IconShield size={14} />
                    {g}
                  </button>
                ))}
              </div>

              <div className={classes.sep} />

              {/* Invite link */}
              <div className={classes.sectionLabel}>Enlace de invitación</div>
              <div className={classes.fieldGroup}>
                <div className={classes.field}>
                  <label className={classes.label}>
                    <IconLink size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Link del clan<span className={classes.required}>*</span>
                  </label>
                  <input
                    className={`${classes.input} ${form.errors.link ? classes.inputError : ''}`}
                    placeholder={
                      game === 'Clash Royale'
                        ? 'https://link.clashroyale.com/invite/clan/...'
                        : 'https://link.clashofclans.com/en?...tag=YOURTAG'
                    }
                    value={form.values.link}
                    onChange={e => form.setFieldValue('link', e.target.value)}
                  />
                  {form.values.link && (
                    <span className={`${classes.linkFeedback} ${isLinkValid ? classes.linkValid : classes.linkInvalid}`}>
                      {isLinkValid
                        ? <><IconCheck size={12} /> Enlace válido de {game}</>
                        : <><IconX size={12} /> Enlace no válido</>}
                    </span>
                  )}
                  {form.errors.link && <span className={classes.errorMsg}><IconX size={11} />{form.errors.link}</span>}
                </div>
              </div>

              <div className={classes.sep} />

              {/* Email */}
              <div className={classes.sectionLabel}>Contacto</div>
              <div className={classes.fieldGroup}>
                <div className={classes.fieldRow}>
                  <div className={classes.field}>
                    <label className={classes.label}>
                      <IconMail size={10} style={{ display: 'inline', marginRight: 4 }} />
                      Tu e‑mail<span className={classes.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${classes.input} ${form.errors.email ? classes.inputError : ''}`}
                      placeholder="email@email.com"
                      value={form.values.email}
                      onChange={e => form.setFieldValue('email', e.target.value)}
                    />
                    {form.errors.email && <span className={classes.errorMsg}><IconX size={11} />{form.errors.email}</span>}
                  </div>
                  <div className={classes.field}>
                    <label className={classes.label}>
                      Confirmar email<span className={classes.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${classes.input} ${form.errors.emailRepeat ? classes.inputError : ''}`}
                      placeholder="email@email.com"
                      value={form.values.emailRepeat}
                      onChange={e => form.setFieldValue('emailRepeat', e.target.value)}
                    />
                    {form.errors.emailRepeat && <span className={classes.errorMsg}><IconX size={11} />{form.errors.emailRepeat}</span>}
                  </div>
                </div>
              </div>

              <div className={classes.sep} />

              {/* Description */}
              <div className={classes.sectionLabel}>Descripción</div>
              <div className={classes.fieldGroup}>
                {baseLang === 'es' ? (
                  <div className={classes.field}>
                    <label className={classes.label}>
                      <IconAlignLeft size={10} style={{ display: 'inline', marginRight: 4 }} />
                      Descripción (Español)<span className={classes.required}>*</span>
                    </label>
                    <textarea
                      className={`${classes.input} ${classes.textarea} ${form.errors.descriptionEs ? classes.inputError : ''}`}
                      placeholder="Describe tu clan: tipo de juego, requisitos, ambiente... (20–320 caracteres)"
                      maxLength={320}
                      value={form.values.descriptionEs}
                      onChange={e => { form.setFieldValue('descriptionEs', e.target.value); debouncedTranslate(); }}
                    />
                    <span className={`${classes.charCount} ${descLen >= 20 ? classes.charCountOk : descLen > 0 ? classes.charCountWarn : ''}`}>
                      {descLen}/320{descLen > 0 && descLen < 20 ? ' · mínimo 20' : ''}
                    </span>
                    {form.errors.descriptionEs && <span className={classes.errorMsg}><IconX size={11} />{form.errors.descriptionEs}</span>}
                  </div>
                ) : (
                  <div className={classes.field}>
                    <label className={classes.label}>
                      <IconAlignLeft size={10} style={{ display: 'inline', marginRight: 4 }} />
                      Description (English)<span className={classes.required}>*</span>
                    </label>
                    <textarea
                      className={`${classes.input} ${classes.textarea} ${form.errors.descriptionEn ? classes.inputError : ''}`}
                      placeholder="Describe your clan: game type, requirements, atmosphere... (20–320 characters)"
                      maxLength={320}
                      value={form.values.descriptionEn}
                      onChange={e => { form.setFieldValue('descriptionEn', e.target.value); debouncedTranslate(); }}
                    />
                    <span className={`${classes.charCount} ${descLen >= 20 ? classes.charCountOk : descLen > 0 ? classes.charCountWarn : ''}`}>
                      {descLen}/320{descLen > 0 && descLen < 20 ? ' · min 20' : ''}
                    </span>
                    {form.errors.descriptionEn && <span className={classes.errorMsg}><IconX size={11} />{form.errors.descriptionEn}</span>}
                  </div>
                )}
              </div>

              <div className={classes.sep} />

              {/* Category */}
              <div className={classes.sectionLabel}>Categoría</div>
              <div className={classes.categoryGrid}>
                {[
                  { value: 'Competitivo',       icon: '⚔️' },
                  { value: 'Casual',             icon: '🎮' },
                  { value: 'Guerras de clanes',  icon: '🏰' },
                  { value: 'Farming',            icon: '🌾' },
                  { value: 'Esports',            icon: '🏆' },
                ].map(({ value, icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${classes.categoryChip} ${form.values.categories === value ? classes.categoryChipActive : ''}`}
                    onClick={() => form.setFieldValue('categories', form.values.categories === value ? '' : value)}
                  >
                    <span className={classes.chipIcon}>{icon}</span>
                    {value}
                  </button>
                ))}
              </div>
              {form.errors.categories && (
                <span className={classes.errorMsg} style={{ marginTop: 6 }}>
                  <IconX size={11} />{form.errors.categories}
                </span>
              )}

              <div className={classes.sep} />

              {/* Terms */}
              <label className={classes.checkRow}>
                <input
                  type="checkbox"
                  className={classes.checkBox}
                  checked={form.values.acceptTerms}
                  onChange={e => form.setFieldValue('acceptTerms', e.target.checked)}
                />
                <span className={classes.checkLabel}>
                  {t('He leído y acepto las')}{' '}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                    condiciones de uso y la privacidad
                  </a>
                </span>
              </label>
              {form.errors.acceptTerms && (
                <span className={classes.errorMsg} style={{ marginTop: 4 }}>
                  <IconX size={11} />{form.errors.acceptTerms}
                </span>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={classes.submitBtn}
                disabled={isLoading}
              >
                {isLoading
                  ? <><span className={classes.spinner} /> Publicando...</>
                  : <><IconSend size={14} /> Publicar clan</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Captcha modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetCaptcha();
        }}
        title={<span style={{ fontWeight: 800, fontSize: 15, color: '#0F0F14', letterSpacing: '-0.02em' }}>{t('Verifica que no eres un bot')}</span>}
        centered
        styles={{
          content: { background: '#fff', borderRadius: 20, border: '1px solid #F0F0F0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' },
          header: { background: '#fff', borderBottom: '1px solid #F5F5F5', borderRadius: '20px 20px 0 0', padding: '1.25rem 1.5rem' },
        }}
      >
        {!shouldBypassCaptchaInDev() && (
          <HCaptcha
            sitekey="71f4e852-9d22-4418-aef6-7c1c0a7c5b54"
            onVerify={handleVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
            ref={captchaRef}
          />
        )}
      </Modal>
    </>
  );
}
