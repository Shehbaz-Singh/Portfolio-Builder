import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

// The tab icon: a "P" on the app's blue. Drawn here so there is no image file to keep in step.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2563eb',
        color: '#ffffff',
        fontSize: 44,
        fontWeight: 800,
        borderRadius: 14,
      }}
    >
      P
    </div>,
    size,
  );
}
