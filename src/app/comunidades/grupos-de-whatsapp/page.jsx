'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconSearch, IconEye, IconChevronRight } from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import classes from '@/app/styles/TableSortWhastapp.module.css';

const countryMap = {
  mx:'🇲🇽', us:'🇺🇸', ar:'🇦🇷', co:'🇨🇴', es:'🇪🇸', pe:'🇵🇪',
  cl:'🇨🇱', ve:'🇻🇪', br:'🇧🇷', ec:'🇪🇨', gt:'🇬🇹', bo:'🇧🇴',
  do:'🇩🇴', hn:'🇭🇳', py:'🇵🇾', sv:'🇸🇻', ni:'🇳🇮', cr:'🇨🇷',
  pa:'🇵🇦', uy:'🇺🇾', pr:'🇵🇷', ca:'🇨🇦', de:'🇩🇪', fr:'🇫🇷',
  it:'🇮🇹', gb:'🇬🇧', nl:'🇳🇱', pt:'🇵🇹', jp:'🇯🇵', kr:'🇰🇷',
  cn:'🇨🇳', in:'🇮🇳', ru:'🇷🇺', au:'🇦🇺',
};

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;
  return data.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.content18?.toLowerCase().includes(q) ||
    item.categories?.some(c => c.toLowerCase().includes(q))
  );
}

export default function Whatsapp() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orden = searchParams.get('orden');
  const baseLang = (i18n.language || 'es').split('-')[0];

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'groups'));
      const groups = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(g => g.tipo === 'whatsapp');

      let ordered = [...groups];
      if (orden === 'top' || orden === 'vistos') {
        ordered.sort((a, b) => (b.visitas ?? 0) - (a.visitas ?? 0));
      } else if (orden === 'nuevos') {
        ordered.sort((a, b) => {
          const da = a.createdAt?.toDate?.() ?? new Date(0);
          const db2 = b.createdAt?.toDate?.() ?? new Date(0);
          return db2 - da;
        });
      }
      setData(ordered);
      setSortedData(ordered);
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    setSortedData(filterData(data, search));
    setCurrentPage(1);
  }, [data, search]);

  const indexOfLast = currentPage * groupsPerPage;
  const indexOfFirst = indexOfLast - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedData.length / groupsPerPage);

  const getDesc = (row) =>
    typeof row.description === 'object'
      ? row.description[baseLang] || row.description[i18n.language] || row.description['es']
      : row.description;

  const getCategoryUrl = (cat) =>
    `/comunidades/grupos-de-whatsapp/${slugify(cat)}`;

  return (
    <>
      <Head>
        <title>Grupos de WhatsApp por Temas [Actualizado 2026] - joingroups.lat</title>
        <meta name="description" content="Descubre y únete a grupos de WhatsApp activos de todas las categorías: amor, amistad, stickers, etc. Enlaces de invitación verificados y actualizados." />
        <link rel="canonical" href="https://www.joingroups.lat/comunidades/grupos-de-whatsapp" />
        <meta property="og:title" content="Los Mejores Grupos de WhatsApp para Unirte | joingroups.lat" />
        <meta property="og:description" content="Busca entre cientos de grupos de WhatsApp y únete con un solo clic." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.joingroups.lat/comunidades/grupos-de-whatsapp" />
        <meta property="og:image" content="https://www.joingroups.lat/wapp.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content="grupos de whatsapp, enlaces de whatsapp, unirse a grupo whatsapp, links de whatsapp" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className={classes.pageBg}>
        <div className={classes.wrapper}>

          {/* Hero */}
          <div className={classes.hero}>
            <div className={classes.eyebrow}>
              <span className={classes.eyebrowDot} />
              Directorio verificado
            </div>
            <h1 className={classes.pageTitle}>Grupos de WhatsApp</h1>
            <p className={classes.pageSub}>
              Únete a comunidades activas de todo el mundo · {sortedData.length} grupos disponibles
            </p>
          </div>

          {/* Platform switcher */}
          <div className={classes.platformRow}>
            <button
              className={classes.platformBtn}
              onClick={() => router.push('/comunidades/grupos-de-telegram')}
            >
              <img src="/telegramicons.webp" alt="Telegram" style={{ width: 15, height: 15 }} />
              Telegram
            </button>
            <button className={`${classes.platformBtn} ${classes.platformBtnActive}`}>
              <img src="/wapp.webp" alt="WhatsApp" style={{ width: 15, height: 15, borderRadius: 4 }} />
              WhatsApp
            </button>
          </div>

          {/* Search + sort */}
          <div className={classes.controlsBar}>
            <div className={classes.searchBox}>
              <IconSearch size={15} className={classes.searchIcon} />
              <input
                className={classes.searchInput}
                placeholder={t('Buscar por nombre, categoría...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={classes.sortRow}>
            {[
              { label: 'Destacados', val: null },
              { label: 'Top vistos', val: 'top' },
              { label: 'Nuevos', val: 'nuevos' },
            ].map(({ label, val }) => (
              <button
                key={label}
                className={`${classes.sortPill} ${orden === val ? classes.sortPillActive : ''}`}
                onClick={() => val ? router.push(`?orden=${val}`) : router.push('?')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Promo banner */}
          <div className={classes.promoBanner}>
            <div className={classes.promoBannerIcon}>
              <img src="/wapp.webp" alt="WhatsApp" style={{ width: 22, height: 22, borderRadius: 4 }} />
            </div>
            <div className={classes.promoBannerBody}>
              <strong>¿Tienes un grupo de WhatsApp?</strong>
              <p>Publícalo gratis en JoinGroups y consigue nuevos miembros interesados al instante.</p>
            </div>
          </div>

          {/* Group cards */}
          {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
            const slug = row.slug || slugify(row.name);
            const mainCat = row.categories?.[0] || 'otros';
            const desc = getDesc(row);

            return (
              <div
                key={`${row.id}-${idx}`}
                className={classes.groupCard}
                onClick={() => router.push(`${getCategoryUrl(mainCat)}/${slug}`)}
              >
                <div className={classes.groupCardTop}>
                  <div className={classes.groupAvatar}>
                    <img src="/wapp.webp" alt="WhatsApp" />
                  </div>
                  <div className={classes.groupInfo}>
                    <div className={classes.groupName}>{row.name}</div>
                    <div className={classes.groupMeta}>
                      {row.city && countryMap[row.city] && (
                        <>
                          <span className={classes.groupFlag}>{countryMap[row.city]}</span>
                          <span className={classes.groupMetaDot} />
                        </>
                      )}
                      {row.content18 === 'Sí' && (
                        <span className={classes.badge18}>18+</span>
                      )}
                    </div>
                  </div>
                  <IconChevronRight size={16} style={{ color: '#D4D4D4', flexShrink: 0 }} />
                </div>

                {desc && (
                  <div className={classes.groupDesc}>{desc}</div>
                )}

                <div className={classes.groupFooter}>
                  <span className={classes.groupCategory}>{mainCat}</span>
                  <span className={classes.groupViews}>
                    <IconEye size={11} />
                    {row.visitas ?? 0}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className={classes.emptyState}>{t('No se encontraron resultados.')}</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={classes.pagination}>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ««
              </button>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ← {t('Anterior')}
              </button>
              <span className={classes.pageInfo}>
                {currentPage} / {totalPages}
              </span>
              <button
                className={classes.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                {t('Siguiente')} →
              </button>
            </div>
          )}

          {/* Footer CTA */}
          <div className={classes.footerCta}>
            <p className={classes.footerCtaTitle}>¿Quieres que tu grupo crezca?</p>
            <p className={classes.footerCtaText}>
              Publica tu grupo gratuitamente en{' '}
              <Link href="/">JoinGroups</Link>{' '}
              y conecta con una comunidad activa que comparte tus intereses.
            </p>
            <Link href="/clanes/clanes-de-clash-royale" className={classes.clashBtn}>
              Ver clanes de Clash Royale →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
