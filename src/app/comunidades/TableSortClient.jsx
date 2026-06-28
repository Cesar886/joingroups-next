'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IconChevronRight, IconEye, IconPlus, IconSearch, IconUsers } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import slugify from '@/lib/slugify';
import styles from '@/app/styles/TableSort.module.css';

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

const platformConfig = {
  telegram: {
    label: 'Telegram',
    icon: '/telegramicons.png',
    iconClass: styles.telegramIcon,
    avatarClass: styles.telegramAvatar,
    chipClass: styles.telegramChip,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: '/wapp.webp',
    iconClass: styles.whatsappIcon,
    avatarClass: styles.whatsappAvatar,
    chipClass: styles.whatsappChip,
  },
};

function getPlatform(row) {
  return row?.tipo?.trim?.().toLowerCase() === 'telegram' ? 'telegram' : 'whatsapp';
}

function getCategories(row) {
  if (Array.isArray(row?.categories)) return row.categories.filter(Boolean);
  if (typeof row?.categories === 'string' && row.categories.trim()) return [row.categories.trim()];
  return [];
}

function getDescription(row, i18n) {
  const baseLang = i18n.language?.split('-')[0] || 'es';
  if (typeof row?.description === 'object' && row.description !== null) {
    return row.description[baseLang] || row.description[i18n.language] || row.description.es || '';
  }
  return row?.description || '';
}

function getCreatedTime(row) {
  const createdAt = row?.createdAt;
  if (!createdAt) return 0;
  if (typeof createdAt === 'string') return new Date(createdAt).getTime() || 0;
  if (createdAt?.seconds) return createdAt.seconds * 1000;
  if (createdAt?.toDate) return createdAt.toDate().getTime();
  return 0;
}

function formatCount(value) {
  const number = Number(value || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
  return String(number);
}

export default function TableSortClient({ serverData = [] }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orden = searchParams.get('orden');
  const catsParam = searchParams.get('cats') || '';

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hostname, setHostname] = useState('');

  const selectedCategories = useMemo(
    () => catsParam.split(',').map((cat) => cat.trim()).filter(Boolean),
    [catsParam]
  );

  const allGroups = useMemo(() => (Array.isArray(serverData) ? serverData : []), [serverData]);

  const categories = useMemo(() => {
    const counts = new Map();
    allGroups.forEach((group) => {
      getCategories(group).forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [allGroups]);

  const stats = useMemo(() => {
    const telegram = allGroups.filter((group) => getPlatform(group) === 'telegram').length;
    const whatsapp = allGroups.filter((group) => getPlatform(group) === 'whatsapp').length;

    return [
      { label: 'Comunidades', value: allGroups.length },
      { label: 'Telegram', value: telegram },
      { label: 'WhatsApp', value: whatsapp },
    ];
  }, [allGroups]);

  const filteredGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const selected = selectedCategories.map((category) => category.toLowerCase());

    let groups = [...allGroups];

    if (orden === 'top' || orden === 'vistos') {
      groups.sort((a, b) => (b.visitas || 0) - (a.visitas || 0));
    } else if (orden === 'nuevos') {
      groups.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
    }

    return groups.filter((group) => {
      const groupCategories = getCategories(group);
      const description = getDescription(group, i18n);
      const searchable = [
        group.name,
        group.content18,
        group.tipo,
        description,
        ...groupCategories,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory =
        selected.length === 0 ||
        groupCategories.some((category) => selected.includes(category.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [allGroups, i18n, orden, search, selectedCategories]);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [catsParam, orden, search]);

  const groupsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / groupsPerPage));
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = filteredGroups.slice(indexOfFirstGroup, indexOfLastGroup);

  const subdomain = hostname.includes('.') && hostname.split('.')[0] !== 'www'
    ? hostname.split('.')[0]
    : 'mx';

  const activeCountry = countries.find((country) => country.value === subdomain) || countries[0];

  const updateQuery = (callback) => {
    const params = new URLSearchParams(searchParams.toString());
    callback(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setSort = (value) => {
    updateQuery((params) => {
      if (value) params.set('orden', value);
      else params.delete('orden');
    });
  };

  const toggleCategory = (category) => {
    updateQuery((params) => {
      const current = params.get('cats')?.split(',').filter(Boolean) || [];
      const exists = current.includes(category);
      const next = exists ? current.filter((item) => item !== category) : [...current, category];

      if (next.length) params.set('cats', next.join(','));
      else params.delete('cats');
    });
  };

  const clearCategories = () => {
    updateQuery((params) => params.delete('cats'));
  };

  const handleCountryChange = (event) => {
    const country = countries.find((item) => item.value === event.target.value);
    if (!country) return;

    const currentPath = window.location.pathname + window.location.search;
    i18n.changeLanguage(country.lang);
    window.location.href = `https://${country.value}.joingroups.lat${currentPath}`;
  };

  return (
    <div className={styles.pageBg}>
      <div className={styles.wrapper}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Directorio de grupos
              </div>
              <h1 className={styles.pageTitle}>Comunidades</h1>
              <p className={styles.pageSub}>
                Explora grupos activos de Telegram y WhatsApp por tema, país y popularidad.
              </p>
            </div>

            <label className={styles.countryControl}>
              <span>{activeCountry.emoji}</span>
              <select value={activeCountry.value} onChange={handleCountryChange} aria-label="Cambiar país">
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.emoji} {country.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.heroStats}>
            {stats.map((stat) => (
              <div className={styles.statCard} key={stat.label}>
                <strong>{formatCount(stat.value)}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.platformRow}>
          <button type="button" className={`${styles.platformBtn} ${styles.platformBtnActive}`}>
            <IconUsers size={15} />
            Todos
          </button>
          <button
            type="button"
            className={styles.platformBtn}
            onClick={() => router.push('/comunidades/grupos-de-telegram')}
          >
            <img src="/telegramicons.png" alt="Telegram" className={styles.platformIcon} />
            Telegram
          </button>
          <button
            type="button"
            className={styles.platformBtn}
            onClick={() => router.push('/comunidades/grupos-de-whatsapp')}
          >
            <img src="/wapp.webp" alt="WhatsApp" className={`${styles.platformIcon} ${styles.platformIconWhatsapp}`} />
            WhatsApp
          </button>
        </div>

        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <IconSearch size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={t('Buscar por nombre, categoría o contenido...')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.sortRow}>
          {[
            { label: 'Destacados', value: null },
            { label: 'Top vistos', value: 'top' },
            { label: 'Nuevos', value: 'nuevos' },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              className={`${styles.sortPill} ${orden === item.value ? styles.sortPillActive : ''}`}
              onClick={() => setSort(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className={styles.categoryRow} aria-label="Categorías">
            <button
              type="button"
              className={`${styles.categoryPill} ${selectedCategories.length === 0 ? styles.categoryPillActive : ''}`}
              onClick={clearCategories}
            >
              Todas
            </button>
            {categories.map((category) => {
              const selected = selectedCategories.includes(category.name);
              return (
                <button
                  type="button"
                  key={category.name}
                  className={`${styles.categoryPill} ${selected ? styles.categoryPillActive : ''}`}
                  onClick={() => toggleCategory(category.name)}
                >
                  {category.name}
                  <span>{category.count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.promoBanner}>
          <div className={styles.promoBannerIconGroup}>
            <span className={`${styles.promoBannerIcon} ${styles.telegramAvatar}`}>
              <img src="/telegramicons.png" alt="Telegram" />
            </span>
            <span className={`${styles.promoBannerIcon} ${styles.whatsappAvatar}`}>
              <img src="/wapp.webp" alt="WhatsApp" />
            </span>
          </div>
          <div className={styles.promoBannerBody}>
            <strong>¿Tienes un grupo activo?</strong>
            <p>Publícalo gratis y deja que nuevos miembros lo encuentren desde el directorio.</p>
          </div>
          <Link href="/comunidades/subir-grupo" className={styles.promoAction}>
            Publicar gratis
          </Link>
        </div>

        {currentGroups.length > 0 ? (
          <div className={styles.groupsList}>
            {currentGroups.map((row, index) => {
              const platform = getPlatform(row);
              const config = platformConfig[platform];
              const categoriesList = getCategories(row);
              const mainCategory = categoriesList[0] || 'otros';
              const slug = row.slug || slugify(row.name || 'grupo');
              const description = getDescription(row, i18n);
              const route = `/comunidades/grupos-de-${platform}/${slugify(mainCategory)}/${slug}`;

              return (
                <article
                  key={`${row.id || slug}-${index}`}
                  className={styles.groupCard}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(route)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(route);
                    }
                  }}
                >
                  <div className={styles.groupCardTop}>
                    <div className={`${styles.groupAvatar} ${config.avatarClass}`}>
                      <img src={config.icon} alt={config.label} className={config.iconClass} />
                    </div>
                    <div className={styles.groupInfo}>
                      <div className={styles.groupName}>{row.name || 'Grupo sin nombre'}</div>
                      <div className={styles.groupMeta}>
                        <span className={`${styles.platformChip} ${config.chipClass}`}>{config.label}</span>
                        {row.city && countryMap[row.city] && <span className={styles.groupFlag}>{countryMap[row.city]}</span>}
                        {row.destacado && <span className={styles.featuredBadge}>Destacado</span>}
                        {row.content18 === 'Sí' && <span className={styles.badge18}>18+</span>}
                      </div>
                    </div>
                    <IconChevronRight size={16} className={styles.chevron} />
                  </div>

                  {description && <div className={styles.groupDesc}>{description}</div>}

                  <div className={styles.groupFooter}>
                    <span className={styles.groupCategory}>{mainCategory}</span>
                    <span className={styles.groupViews}>
                      <IconEye size={11} />
                      {row.visitas ?? 0}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>No se encontraron comunidades</strong>
            <span>Prueba con otra búsqueda o elimina algún filtro de categoría.</span>
          </div>
        )}

        {filteredGroups.length > groupsPerPage && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              Inicio
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
            >
              ← {t('Anterior')}
            </button>
            <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              {t('Siguiente')} →
            </button>
          </div>
        )}

        <section className={styles.footerCta}>
          <div>
            <p className={styles.footerCtaTitle}>Haz crecer tu comunidad</p>
            <p className={styles.footerCtaText}>
              Publica tu grupo o canal en <Link href="/">JoinGroups</Link> y permite que más personas lo encuentren por temática, red social y país.
            </p>
          </div>
          <div className={styles.footerActions}>
            <Link href="/comunidades/subir-grupo" className={styles.primaryCta}>Publicar grupo</Link>
            <Link href="/clanes/clanes-de-clash-royale" className={styles.secondaryCta}>Ver clanes</Link>
          </div>
        </section>
      </div>

      <Link href="/comunidades/subir-grupo" className={styles.floatingPublishButton} aria-label="Publicar grupo">
        <IconPlus size={18} />
        <span>Publicar</span>
      </Link>
    </div>
  );
}
