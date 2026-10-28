import { ImageResponse } from 'next/og';
import { loadDevanagariFont } from '@/lib/og-font';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// The icon for a phone's home screen: "प" in the brand accent on paper. Square and unrounded: the
// phone rounds it itself.
export default async function AppleIcon() {
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
        fontSize: 150,
        paddingTop: 50,
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
