import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 42,
          background: 'linear-gradient(135deg, #F5B301, #7C3AED)',
          color: 'rgba(255,255,255,0.98)',
          fontSize: 112,
          fontWeight: 900,
          letterSpacing: '-0.04em',
        }}
      >
        k
      </div>
    ),
    { ...size },
  );
}
