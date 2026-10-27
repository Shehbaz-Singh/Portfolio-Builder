import { ImageResponse } from 'next/og';

export const alt = 'Portfolio Generator: build and share your portfolio page';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The card shown when the home page is shared.
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#2563eb',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 600, opacity: 0.9 }}>Portfolio Generator</div>
      <div style={{ marginTop: 24, fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
        A portfolio page you can share with one link
      </div>
      <div style={{ marginTop: 32, fontSize: 34, opacity: 0.9 }}>
        Fill in your details, pick a theme, publish.
      </div>
    </div>,
    size,
  );
}
