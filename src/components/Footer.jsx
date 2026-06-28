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
      title: 'Comunidad',
      links: [
        { label: t('Instagram Oficial'), link: 'https://www.instagram.com/daniel110a/' },
        { label: t('Grupo en Telegram'), link: 'https://t.me/PhotosOfficialbot' },
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
                href={i18n.language === 'es' ? 'https://joingroups.lat' : 'https://joingroups.lat'}
                style={{ color: '#E5E7EB', textDecoration: 'none', fontWeight: 500 }}
              >
                JoinGroups
              </Link>
              {t(' es tu herramienta para administrar, automatizar y organizar grupos de Telegram de forma eficiente.')}
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

        {/* After Footer */}
        <div className={classes.afterFooter}>
          <span style={{ color: '#6B7280', fontSize: '13px' }}>
            © {new Date().getFullYear()} joingroups.lat. {t('Todos los derechos reservados.')}
          </span>

          <div className={classes.social}>
            <a
              href="https://www.instagram.com/daniel110a/"
              target="_blank"
              rel="noopener noreferrer"
              className={classes.socialIcon}
              aria-label="Instagram"
            >
              <IconBrandInstagram size={16} stroke={1.5} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
