import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const bgTop = '#070B14';
const bgBottom = '#0B1326';
const primary = '#F5B301';
const secondary = '#7C3AED';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${bgTop}, ${bgBottom})`,
          color: 'white',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 22%, rgba(245,179,1,0.22), transparent 52%), radial-gradient(circle at 85% 15%, rgba(124,58,237,0.18), transparent 46%), radial-gradient(circle at 55% 90%, rgba(245,179,1,0.12), transparent 55%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: '100%',
            padding: '84px 92px',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              k
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                opacity: 0.92,
              }}
            >
              klabo.world
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.06,
              }}
            >
              Notes, playbooks, and projects for shipping on decentralized rails.
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.35,
                color: 'rgba(226, 232, 240, 0.88)',
                maxWidth: 940,
              }}
            >
              Bitcoin · Lightning · Nostr · Agentic engineering
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 'auto', flexWrap: 'wrap' }}>
            {['Writing', 'Projects', 'Tools'].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(245,179,1,0.35)',
                  backgroundColor: 'rgba(245,179,1,0.12)',
                  padding: '10px 16px',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
