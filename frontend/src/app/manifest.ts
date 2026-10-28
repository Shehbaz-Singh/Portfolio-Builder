import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Parichay',
    short_name: 'Parichay',
    description: 'Build and share your portfolio page.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f0',
    theme_color: '#b4492b',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
