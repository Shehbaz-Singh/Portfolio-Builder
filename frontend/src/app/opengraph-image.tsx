import { ImageResponse } from 'next/og';
import { loadDevanagariFont } from '@/lib/og-font';

export const alt = 'Parichay: introduce yourself properly';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The card shown when the home page is shared. The wordmark is "परिchay", written here in visual
// order ("पिर"): this renderer does not move the i-matra before its letter by itself.
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#fbf7f0',
        color: '#1f1a17',
        fontFamily: 'Devanagari',
        fontWeight: 700,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 96, lineHeight: 1.1 }}>
        <span>पिर</span>
        <span>chay</span>
      </div>
      <div style={{ marginTop: 36, fontSize: 84, lineHeight: 1.05 }}>
        Introduce yourself properly.
      </div>
      <div style={{ marginTop: 28, fontSize: 34, color: '#665d54' }}>
        Your resume, a portfolio page and one link that’s yours.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 16,
          background: '#b4492b',
        }}
      />
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Devanagari', data: await loadDevanagariFont(), weight: 700, style: 'normal' },
      ],
    },
  );
}
