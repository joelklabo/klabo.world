import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #F5B301, #7C3AED)',
          color: 'rgba(255,255,255,0.98)',
          fontSize: 20,
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
