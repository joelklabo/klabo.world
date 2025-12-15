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
        }}
      >
        <svg width="118" height="118" viewBox="0 0 512 512" fill="none">
          <path
            d="M236 160 L236 352"
            stroke="rgba(255,255,255,0.97)"
            strokeWidth="56"
            strokeLinecap="round"
          />
          <path
            d="M258 256 L350 170"
            stroke="rgba(255,255,255,0.97)"
            strokeWidth="56"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M258 256 L354 352"
            stroke="rgba(255,255,255,0.97)"
            strokeWidth="56"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
