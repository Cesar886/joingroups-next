'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useRef, useState } from 'react';
import slugify from '@/lib/slugify';
import { logPublication, shouldBypassCaptchaInDev } from '@/lib/publicationDebug';
import { useTranslation } from 'react-i18next';
import { useForm } from '@mantine/form';
import {
  IconBrandWhatsapp, IconLink, IconMail, IconAlignLeft,
  IconMapPin, IconCheck, IconX, IconSend, IconUser,
} from '@tabler/icons-react';
import classes from '@/app/styles/SubirGrupo.module.css';

const DEEPL_PROXY_URL = 'https://daniel-rdz.tech/translate';

const CITIES = [
  { value: 'mx', label: 'México' }, { value: 'us', label: 'Estados Unidos' },
  { value: 'ar', label: 'Argentina' }, { value: 'co', label: 'Colombia' },
  { value: 'es', label: 'España' }, { value: 'pe', label: 'Perú' },
  { value: 'cl', label: 'Chile' }, { value: 've', label: 'Venezuela' },
  { value: 'br', label: 'Brasil' }, { value: 'ec', label: 'Ecuador' },
  { value: 'gt', label: 'Guatemala' }, { value: 'bo', label: 'Bolivia' },
  { value: 'do', label: 'República Dominicana' }, { value: 'hn', label: 'Honduras' },
  { value: 'py', label: 'Paraguay' }, { value: 'sv', label: 'El Salvador' },
  { value: 'ni', label: 'Nicaragua' }, { value: 'cr', label: 'Costa Rica' },
  { value: 'pa', label: 'Panamá' }, { value: 'uy', label: 'Uruguay' },
  { value: 'pr', label: 'Puerto Rico' }, { value: 'ca', label: 'Canadá' },
  { value: 'de', label: 'Alemania' }, { value: 'fr', label: 'Francia' },
  { value: 'it', label: 'Italia' }, { value: 'gb', label: 'Reino Unido' },
  { value: 'nl', label: 'Países Bajos' }, { value: 'pt', label: 'Portugal' },
  { value: 'jp', label: 'Japón' }, { value: 'kr', label: 'Corea del Sur' },
  { value: 'cn', label: 'China' }, { value: 'in', label: 'India' },
  { value: 'ru', label: 'Rusia' }, { value: 'au', label: 'Australia' },
];

const ALL_CATEGORIES = [
  'Hot', 'NSFW', 'Anime y Manga', 'Películas y Series', 'Porno',
  'Criptomonedas', 'Xxx', 'Hacking', 'Memes y Humor', '18+', 'Fútbol',
  'Tecnología', 'Programación', 'Gaming', 'Cursos y Tutoriales',
  'Música y Podcasts', 'Arte y Diseño', 'Ciencia y Educación',
  'Negocios y Finanzas', 'Packs', 'Trading', 'Ofertas y Descuentos',
  'Emprendimiento', 'Relaciones y Citas', 'Telegram Bots', 'Stickers',
];

const telegramRegex = /^https:\/\/t\.me\/(?:[a-zA-Z0-9_]{5,}|c\/\d+\/\d+|\+[a-zA-Z0-9_-]{10,})$/;
const whatsappGroupRegex = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}$/;
const whatsappChannelRegex = /^https:\/\/(wa\.me|whatsapp\.com)\/channel\/[a-zA-Z0-9_]{8,}$/;

export default function SubirGrupo() {
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const baseLang = i18n.language.split('-')[0];
  const [redSocial, setRedSocial] = useState('Telegram');
  const [modalOpen, setModalOpen] = useState(false);
  const captchaRef = useRef(null);
  const submittingRef = useRef(false);

  const form = useForm({
    initialValues: {
      name: '', link: '', email: '', emailRepeat: '',
      descriptionEs: '', descriptionEn: '',
      city: '', content18: '', categories: [], acceptTerms: false,
    },
    validate: {
      name: (v) => {
        const t2 = v.trim();
        if (!t2) return t('El nombre es obligatorio');
        if (!/[a-zA-Z0-9]/.test(t2)) return t('El nombre no puede ser solo emojis');
        return null;
      },
      email: (v) => /^\S+@\S+\.\S+$/.test(v) ? null : t('Email inválido'),
      emailRepeat: (v, vals) => v === vals.email ? null : t('Los emails no coinciden'),
      acceptTerms: (v) => v ? null : t('Debes aceptar los términos'),
      categories: (v) => {
        if (!Array.isArray(v) || v.length < 1) return t('Selecciona al menos una categoría');
        if (v.length > 3) return t('Máximo 3 categorías');
        return null;
      },
      descriptionEs: (v, values) => {
        const ok = (v.trim().length >= 20 && v.trim().length <= 320) ||
          (values.descriptionEn.trim().length >= 20 && values.descriptionEn.trim().length <= 320);
        return ok ? null : t('Debes escribir una descripción (20–320 caracteres)');
      },
      descriptionEn: (v, values) => {
        const ok = (v.trim().length >= 20 && v.trim().length <= 320) ||
          (values.descriptionEs.trim().length >= 20 && values.descriptionEs.trim().length <= 320);
        return ok ? null : t('You must write a description (20–320 characters)');
      },
      link: (v) => {
        const val = v.trim();
        if (redSocial === 'Telegram' && !telegramRegex.test(val)) return t('El enlace de Telegram no es válido');
        if (redSocial === 'Whatsapp' && !whatsappGroupRegex.test(val) && !whatsappChannelRegex.test(val))
          return t('El enlace de WhatsApp debe ser un grupo o canal válido');
        return null;
      },
    },
  });

  async function translateText(text, source, target) {
    if (shouldBypassCaptchaInDev()) return '';

    try {
      const res = await fetch(DEEPL_PROXY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, target }),
      });
      if (!res.ok) return '';
      const data = await res.json();
      return data.translated;
    } catch { return ''; }
  }

  const useDebouncedCallback = (cb, delay = 800) => {
    const timeout = useRef(null);
    return (...args) => { clearTimeout(timeout.current); timeout.current = setTimeout(() => cb(...args), delay); };
  };

  const debouncedTranslate = useDebouncedCallback(async () => {
    const { descriptionEs, descriptionEn } = form.values;
    if (baseLang === 'es' && descriptionEs.trim().length >= 20 && !descriptionEn.trim())
      form.setFieldValue('descriptionEn', await translateText(descriptionEs, 'ES', 'EN'));
    if (baseLang === 'en' && descriptionEn.trim().length >= 20 && !descriptionEs.trim())
      form.setFieldValue('descriptionEs', await translateText(descriptionEn, 'EN', 'ES'));
  }, 700);

  const resetCaptcha = () => {
    captchaRef.current?.resetCaptcha?.();
  };

  const handleCaptchaError = () => {
    logPublication('group', 'captcha_error', { redSocial, link: form.values.link });
    resetCaptcha();
    setModalOpen(false);
    showNotification({
      title: t('Error de verificación'),
      message: t('No se pudo completar el captcha. Inténtalo de nuevo.'),
      color: 'red',
    });
  };

  const handleCaptchaExpire = () => {
    logPublication('group', 'captcha_expired', { redSocial, link: form.values.link });
    resetCaptcha();
    showNotification({
      title: t('Captcha expirado'),
      message: t('Vuelve a verificar que no eres un bot.'),
      color: 'yellow',
    });
  };

  const getAvailableGroupSlug = async (baseSlug) => {
    const normalizedBase = baseSlug || 'grupo';

    for (let suffix = 0; suffix < 50; suffix++) {
      const candidate = suffix === 0 ? normalizedBase : normalizedBase + '-' + (suffix + 1);
      const snap = await getDocs(query(collection(db, 'groups'), where('slug', '==', candidate)));

      if (snap.empty) {
        if (candidate !== normalizedBase) {
          await logPublication('group', 'slug_auto_incremented', {
            from: normalizedBase,
            to: candidate,
          });
        }

        return candidate;
      }
    }

    throw new Error(t('No se pudo generar una URL única para este grupo.'));
  };

  const handleVerify = async (token) => {
    if (!token || submittingRef.current) return;

    submittingRef.current = true;
    setModalOpen(false);
    setIsLoading(true);

    try {
      const rawLink = form.values.link.trim();
      const cleanLink = rawLink.endsWith('/') ? rawLink.slice(0, -1) : rawLink;
      await logPublication('group', 'publish_started', {
        redSocial,
        name: form.values.name,
        link: cleanLink,
        categories: form.values.categories,
      });

      const existing = await getDocs(query(collection(db, 'groups'), where('link', '==', cleanLink)));
      if (!existing.empty) {
        await logPublication('group', 'duplicate_link', { link: cleanLink });
        showNotification({ title: t('Enlace duplicado'), message: t('Este grupo ya fue publicado antes 📌'), color: 'red' });
        return;
      }

      const baseSlug = slugify(form.values.name);
      const slug = await getAvailableGroupSlug(baseSlug);

      const { descriptionEs, descriptionEn, ...cleanValues } = form.values;
      const docRef = await addDoc(collection(db, 'groups'), {
        ...cleanValues,
        tipo: redSocial.toLowerCase(),
        description: { es: descriptionEs.trim(), en: descriptionEn.trim() },
        link: cleanLink, slug,
        destacado: false, visitas: 0, createdAt: new Date(),
        translationPending: !descriptionEs.trim() || !descriptionEn.trim(),
      });

      if (!descriptionEs.trim() || !descriptionEn.trim()) {
        const text = descriptionEs.trim() || descriptionEn.trim();
        const source = descriptionEs.trim() ? 'ES' : 'EN';
        const target = descriptionEs.trim() ? 'EN' : 'ES';
        let attempts = 0, fails = 0;
        const iv = setInterval(async () => {
          attempts++;
          try {
            const translated = await translateText(text, source, target);
            if (translated && translated.length >= 20) {
              await updateDoc(docRef, { [`description.${target.toLowerCase()}`]: translated, translationPending: false });
              clearInterval(iv);
            } else fails++;
          } catch { fails++; }
          if (attempts >= 80 || fails >= 10) clearInterval(iv);
        }, 5000);
      }

      const catSlug = slugify(form.values.categories[0] || 'general');
      const destination = `/comunidades/grupos-de-${redSocial.toLowerCase()}/${catSlug}/${slug}`;
      await logPublication('group', 'publish_success', { id: docRef.id, slug, destination });
      form.reset();
      window.location.assign(destination);
    } catch (error) {
      console.error(error);
      await logPublication('group', 'publish_error', {
        code: error?.code,
        message: error?.message || String(error),
      });
      showNotification({
        title: t('Error'),
        message: error?.code === 'permission-denied'
          ? t('No se pudo publicar por permisos de la base de datos.')
          : t('No se pudo guardar. Inténtalo de nuevo.'),
        color: 'red',
      });
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
      resetCaptcha();
    }
  };

  const toggleCategory = (cat) => {
    const current = form.values.categories;
    if (current.includes(cat)) {
      form.setFieldValue('categories', current.filter(c => c !== cat));
    } else if (current.length < 3) {
      form.setFieldValue('categories', [...current, cat]);
    }
  };

  const linkVal = form.values.link.trim();
  const isLinkValid = redSocial === 'Telegram'
    ? telegramRegex.test(linkVal)
    : whatsappGroupRegex.test(linkVal) || whatsappChannelRegex.test(linkVal);

  const descLen = baseLang === 'es' ? form.values.descriptionEs.length : form.values.descriptionEn.length;

  return (
    <>
      <div className={classes.pageBg}>
        <div className={classes.wrapper}>

          {/* Header */}
          <div className={classes.header}>
            <div className={classes.eyebrow}>
              <span className={classes.eyebrowDot} />
              Directorio verificado
            </div>
            <h1 className={classes.pageTitle}>{t('Publica tu Grupo')}</h1>
            <p className={classes.pageSub}>Tu comunidad aparecerá en el directorio en minutos.</p>
          </div>

          {/* Support banner */}
          <a
            href="https://wa.me/5218261308623?text=Hola,%20tengo%20un%20problema%20para%20publicar%20mi%20grupo%20en%20JoinGroups"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.suggestionBanner}
          >
            <div className={classes.suggestionIcon}>
              <IconBrandWhatsapp size={17} />
            </div>
            <div className={classes.suggestionText}>
              <strong>¿Tienes problemas?</strong>
              Escríbenos por WhatsApp y te ayudamos
            </div>
          </a>

          {/* Form card */}
          <div className={classes.card}>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (isLoading) return;

              const validation = form.validate();
              if (validation.hasErrors) {
                logPublication('group', 'validation_failed', {
                  redSocial,
                  name: form.values.name,
                  link: form.values.link,
                  errors: validation.errors,
                });
                return;
              }

              const bypassCaptcha = shouldBypassCaptchaInDev();
              logPublication('group', 'submit_valid', {
                redSocial,
                name: form.values.name,
                link: form.values.link,
                captchaBypassed: bypassCaptcha,
              });

              if (bypassCaptcha) {
                logPublication('group', 'captcha_bypassed_local_dev', { redSocial, link: form.values.link });
                handleVerify('local-dev-bypass');
                return;
              }

              resetCaptcha();
              setModalOpen(true);
            }}>

              {/* Platform */}
              <div className={classes.sectionLabel}>Red social</div>
              <div className={classes.toggleRow}>
                {['Telegram', 'Whatsapp'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`${classes.toggleBtn} ${redSocial === p ? classes.toggleBtnActive : ''}`}
                    onClick={() => { setRedSocial(p); form.setFieldValue('link', ''); }}
                  >
                    <img
                      src={p === 'Telegram' ? '/telegramicons.png' : '/wapp.webp'}
                      alt={p}
                      style={{ width: 16, height: 16, borderRadius: p === 'Whatsapp' ? 4 : 0 }}
                    />
                    {p}
                  </button>
                ))}
              </div>

              <div className={classes.sep} />

              {/* Name */}
              <div className={classes.sectionLabel}>Nombre del grupo</div>
              <div className={classes.fieldGroup}>
                <div className={classes.field}>
                  <label className={classes.label}>
                    <IconUser size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Nombre<span className={classes.required}>*</span>
                  </label>
                  <input
                    className={`${classes.input} ${form.errors.name ? classes.inputError : ''}`}
                    placeholder={`Nombre del grupo de ${redSocial}`}
                    value={form.values.name}
                    onChange={e => form.setFieldValue('name', e.target.value)}
                  />
                  {form.errors.name && <span className={classes.errorMsg}><IconX size={11} />{form.errors.name}</span>}
                </div>
              </div>

              <div className={classes.sep} />

              {/* Link */}
              <div className={classes.sectionLabel}>Enlace de invitación</div>
              <div className={classes.fieldGroup}>
                <div className={classes.field}>
                  <label className={classes.label}>
                    <IconLink size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Link del grupo<span className={classes.required}>*</span>
                  </label>
                  <input
                    className={`${classes.input} ${form.errors.link ? classes.inputError : ''}`}
                    placeholder={redSocial === 'Telegram' ? 'https://t.me/...' : 'https://chat.whatsapp.com/...'}
                    value={form.values.link}
                    onChange={e => form.setFieldValue('link', e.target.value)}
                  />
                  {linkVal && (
                    <span className={`${classes.linkFeedback} ${isLinkValid ? classes.linkValid : classes.linkInvalid}`}>
                      {isLinkValid
                        ? <><IconCheck size={12} /> {redSocial === 'Whatsapp' && whatsappChannelRegex.test(linkVal) ? 'Canal de WhatsApp válido' : `Enlace válido de ${redSocial}`}</>
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
                    <label className={classes.label}>Confirmar email<span className={classes.required}>*</span></label>
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
                <div className={classes.field}>
                  <label className={classes.label}>
                    <IconAlignLeft size={10} style={{ display: 'inline', marginRight: 4 }} />
                    {baseLang === 'es' ? 'Descripción (Español)' : 'Description (English)'}<span className={classes.required}>*</span>
                  </label>
                  <textarea
                    className={`${classes.input} ${classes.textarea} ${(baseLang === 'es' ? form.errors.descriptionEs : form.errors.descriptionEn) ? classes.inputError : ''}`}
                    placeholder={baseLang === 'es'
                      ? 'Describe tu grupo: temática, reglas, ambiente... (20–320 caracteres)'
                      : 'Describe your group: topic, rules, vibe... (20–320 characters)'}
                    maxLength={320}
                    value={baseLang === 'es' ? form.values.descriptionEs : form.values.descriptionEn}
                    onChange={e => {
                      form.setFieldValue(baseLang === 'es' ? 'descriptionEs' : 'descriptionEn', e.target.value);
                      debouncedTranslate();
                    }}
                  />
                  <span className={`${classes.charCount} ${descLen >= 20 ? classes.charCountOk : descLen > 0 ? classes.charCountWarn : ''}`}>
                    {descLen}/320{descLen > 0 && descLen < 20 ? ' · mínimo 20' : ''}
                  </span>
                </div>
              </div>

              <div className={classes.sep} />

              {/* City */}
              <div className={classes.sectionLabel}>Ubicación</div>
              <div className={classes.fieldGroup}>
                <div className={classes.field}>
                  <label className={classes.label}>
                    <IconMapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
                    País / Ciudad<span className={classes.required}>*</span>
                  </label>
                  <select
                    className={`${classes.input} ${classes.select}`}
                    value={form.values.city}
                    onChange={e => form.setFieldValue('city', e.target.value)}
                    required
                  >
                    <option value="">Selecciona un país</option>
                    {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className={classes.sep} />

              {/* Categories */}
              <div className={classes.sectionLabel}>Categorías <span style={{ color: '#C4C4C4', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(máx. 3)</span></div>
              <div className={classes.categoryGrid}>
                {ALL_CATEGORIES.map(cat => {
                  const active = form.values.categories.includes(cat);
                  const maxed = !active && form.values.categories.length >= 3;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`${classes.categoryChip} ${active ? classes.categoryChipActive : ''} ${maxed ? classes.categoryChipDisabled : ''}`}
                      onClick={() => !maxed && toggleCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              {form.values.categories.length > 0 && (
                <div className={classes.categoryCount}>{form.values.categories.length}/3 seleccionadas</div>
              )}
              {form.errors.categories && (
                <span className={classes.errorMsg} style={{ marginTop: 6 }}>
                  <IconX size={11} />{form.errors.categories}
                </span>
              )}

              <div className={classes.sep} />

              {/* Content 18+ */}
              <div className={classes.sectionLabel}>Contenido para adultos</div>
              <div className={classes.toggleRow}>
                {['No', 'Sí'].map(v => (
                  <button
                    key={v}
                    type="button"
                    className={`${classes.toggleBtn} ${form.values.content18 === v ? classes.toggleBtnActive : ''}`}
                    onClick={() => form.setFieldValue('content18', v)}
                  >
                    {v === 'Sí' ? '18+ Sí, tiene contenido adulto' : 'No, apto para todos'}
                  </button>
                ))}
              </div>

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
                  He leído y acepto las{' '}
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
              <button type="submit" className={classes.submitBtn} disabled={isLoading}>
                {isLoading
                  ? <><span className={classes.spinner} /> Publicando...</>
                  : <><IconSend size={14} /> Publicar grupo</>}
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
        title={<span style={{ fontWeight: 800, fontSize: 15, color: '#0F0F14', letterSpacing: '-0.02em' }}>Verifica que no eres un bot</span>}
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
