"use client";

import { IconBrandInstagram } from '@tabler/icons-react';
import classes from '@/app/styles/Footer.module.css';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';



export default function Footer() {
  const { t, i18n } = useTranslation();

  const data = [
    {
      title: t('Sobre Nosotros'),
      links: [
        { label: t('Contáctanos por WhatsApp'), link: 'https://wa.me/528261308623?text=Hola,%20quiero%20más%20información' },
        { label: t('Términos y condiciones'), link: '/terminos' },
        { label: t('Política de privacidad'), link: '/privacidad' },
        { label: t('Acerca de JoinGroup'), link: '/acerca' },
      ],
    },
    {
      title: 'Clanes',
      links: [
        { label: 'Clanes de Clash Royale', link: '/clanes/clanes-de-clash-royale' },
        { label: 'Publicar clan', link: '/clanes/publicar-clan' },
        { label: 'Todos los clanes', link: '/clanes' },
      ],
    },
  ];

  return (
    <footer className={classes.footer}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>

        {/* Main Footer Content */}
        <div className={classes.inner}>
          {/* Logo + Description */}
          <div className={`${classes.logoWrapper}`} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <img
              src="/JoinGroups.png"
              alt="Logo de JoinGroup"
              className={classes.logo}
            />
            <p className={classes.description}>
              <Link
                href={i18n.language === 'es' ? 'https://www.joingroups.lat' : 'https://www.joingroups.lat'}
                style={{ color: '#E5E7EB', textDecoration: 'none', fontWeight: 500 }}
              >
                JoinGroups
              </Link>
              {' es tu directorio para encontrar clanes de Clash Royale, publicar clanes y descubrir comunidades activas.'}
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {data.map((group) => (
              <div key={group.title}>
                <div className={classes.title}>{group.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.links.map((link) => {
                    const isExternal = link.link.startsWith('http') || link.link.startsWith('mailto');
                    return isExternal ? (
                      <a
                        key={link.label}
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={classes.link}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.label}
                        href={link.link}
                        className={classes.link}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
