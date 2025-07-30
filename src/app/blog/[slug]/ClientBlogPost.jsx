'use client';

import { Container, Title, Box } from '@mantine/core';
import { createStyles } from '@mantine/styles';

const useStyles = createStyles((theme) => ({
  content: {
    fontSize: '18px',
    lineHeight: 1.8,
    color: '#333',
    paddingLeft: '1rem',
    paddingRight: '1rem',

    [theme.fn.largerThan('sm')]: {
      paddingLeft: '3rem',
      paddingRight: '3rem',
    },

    a: {
      color: theme.colors.blue[7],
      textDecoration: 'underline',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: theme.colors.blue[9],
        textDecoration: 'none',
      },
    },

    h2: {
      fontSize: '24px',
      marginTop: '2rem',
      marginBottom: '1rem',
      color: theme.colors.gray[8],
    },

    ul: {
      paddingLeft: '1.5rem',
      marginBottom: '1rem',
    },

    li: {
      marginBottom: '0.5rem',
    },

    p: {
      marginBottom: '1.25rem',
    },
  },
}));

export default function ClientBlogPost({ post }) {
  const { classes } = useStyles();

  return (
    <Container size="md" py="xl" px={{ base: 'md', sm: 'lg', md: 'xl' }}>
      <Title order={1} align="center" mb="lg">
        {post.title}
      </Title>

      <Box
        className={classes.content}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </Container>
  );
}
