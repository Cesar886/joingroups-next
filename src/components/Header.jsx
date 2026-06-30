"use client";

import { Container, Group } from '@mantine/core';
import classes from '@/app/styles/Header.module.css';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { t } = useTranslation();
  const pathname = usePathname(); // ← usa esto directamente

  const isClanesSection = pathname.startsWith('/clanes');
  
  
  const links = [
    { link: '/', label: t('Inicio') },
    {
      link: isClanesSection ? '/clanes/publicar-clan' : '/comunidades/subir-grupo',
      label: isClanesSection ? t('Publica tu clan') : t('Publica Tu Grupo'),
      highlight: true,
    },
  ];
  
  const items = links.map((link) => {
    const isActive = pathname.startsWith(link.link);
    const navLink = (
      <Link
        key={link.link}
        href={link.link}
        className={isActive ? 'active' : ''}
      >
        {link.label}
      </Link>

    );

    return link.highlight ? (
      <div key={link.link} className={classes.ledBorder}>
        {navLink}
      </div>
    ) : (
      navLink
    );
  });

  return (
    <header className={classes.header}>
      <Container size="md">
        <div className={classes.inner}>
          <Link href="/" className={classes.logoLink}>
            <Group align="center" gap="xs" wrap="nowrap">
              <img
                src="/JoinGroups.png"
                alt="Join Group Logo"
                width={42}
                height={42}
                style={{ objectFit: 'contain' }}
              />
              <span className={classes.logoText}>JoinGroup</span>
            </Group>
          </Link>

          <Group
            gap={6}
            justify="flex-end"
            align="center"
            wrap="nowrap"
            style={{ flex: 1, overflowX: 'hidden' }} // CAMBIO: de 'auto' a 'hidden'
          >
            {items}
          </Group>
        </div>
      </Container>
    </header>
  );
}
