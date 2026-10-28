import { ImageResponse } from 'next/og';
import { loadDevanagariFont } from '@/lib/og-font';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// The tab icon: the Devanagari letter "प" (the first letter of Parichay) in the brand accent on
// paper. Drawn here so there is no image file to keep in step.
export default async function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fbf7f0',
        color: '#b4492b',
        fontFamily: 'Devanagari',
        fontSize: 60,
        borderRadius: 14,
        paddingTop: 12,
      }}
    >
      प
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Devanagari', data: await loadDevanagariFont(), weight: 700, style: 'normal' },
      ],
    },
  );
}
