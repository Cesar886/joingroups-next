"use client";

import {
  ActionIcon,
  Center,
  Container,
  Group,
  Menu,
  Tooltip,
  rem,
  Box,
} from '@mantine/core';
import classes from '@/app/styles/Header.module.css';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import i18n from '@/locales/i18n.jsx';



const countries = [
  { value: 'es', label: 'México', emoji: '🇲🇽', lang: 'es' },
  { value: 'en', label: 'Estados Unidos', emoji: '🇺🇸', lang: 'en' },
];


export default function Header() {
  const { t, i18n } = useTranslation();
  const [subdomain, setSubdomain] = useState('mx');
  const pathname = usePathname(); // ← usa esto directamente

  // Detectar subdominio desde la URL
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('.')) {
      setSubdomain(hostname.split('.')[0]);
    }
  }, []);

  const isclansSection = pathname.startsWith('/clans') || pathname.startsWith('/clanes');
  
  
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
      <motion.div
        key={link.link}
        animate={link.highlight ? { scale: [1, 1.05, 1] } : false}
        transition={link.highlight ? { duration: 1.5, repeat: Infinity } : undefined}
        className={link.highlight ? classes.ledBorder : undefined}
      >
        {navLink}
      </motion.div>
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

          {/* Menú de selección de país fuera del contenedor con scroll */}
          <Box
            onPointerDownCapture={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <Menu shadow="md" width={200} withinPortal position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  size="lg"
                  radius="xl"
                  variant="subtle"
                  style={{ fontSize: rem(24) }}
                >
                  {countries.find((c) => c.value === subdomain)?.emoji ?? '🇲🇽'}
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown
                style={{
                  maxHeight: rem(300),
                  overflowY: 'auto',
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {countries.map((country) => (
                  <Menu.Item
                    key={country.value}
                    leftSection={country.emoji}
                    onClick={() => {
                      i18n.changeLanguage(country.lang);
                      window.location.href = `https://${country.value}.joingroups.pro`;
                    }}
                  >
                    {country.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>

            </Menu>
          </Box>

        </div>
      </Container>
    </header>
  );
}
