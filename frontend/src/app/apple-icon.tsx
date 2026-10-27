import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// The icon for a phone's home screen. Square and unrounded: the phone rounds it itself.
export default function AppleIcon() {
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
        fontSize: 120,
        fontWeight: 800,
      }}
    >
      P
    </div>,
    size,
  );
}
