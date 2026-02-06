import { ImageResponse } from 'next/og';
import { createElement } from 'react';
import { getPublicSiteUrl } from '@/lib/public-env';

export const runtime = 'nodejs';
export const revalidate = 86_400;

const bgTop = '#070B14';
const bgBottom = '#0B1326';
const primary = '#F5B301';
const secondary = '#7C3AED';

export async function GET() {
  const site = new URL(getPublicSiteUrl());
  site.pathname = '';

  const logoMark = createElement(
    'svg',
    { width: 44, height: 44, viewBox: '0 0 512 512', fill: 'none' },
    createElement('path', {
      d: 'M236 160 L236 352',
      stroke: 'rgba(255,255,255,0.97)',
      strokeWidth: 56,
      strokeLinecap: 'round',
    }),
    createElement('path', {
      d: 'M258 256 L350 170',
      stroke: 'rgba(255,255,255,0.97)',
      strokeWidth: 56,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    createElement('path', {
      d: 'M258 256 L354 352',
      stroke: 'rgba(255,255,255,0.97)',
      strokeWidth: 56,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  );

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${bgTop}, ${bgBottom})`,
          color: 'white',
        },
      },
      createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 18% 22%, rgba(245,179,1,0.22), transparent 52%), radial-gradient(circle at 85% 15%, rgba(124,58,237,0.18), transparent 46%), radial-gradient(circle at 55% 90%, rgba(245,179,1,0.12), transparent 55%)',
        },
      }),
      createElement(
        'div',
        {
          style: {
            position: 'relative',
            width: '100%',
            padding: '84px 92px',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          },
        },
        createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 18 } },
          createElement(
            'div',
            {
              style: {
                width: 64,
                height: 64,
                borderRadius: 22,
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
              },
              'aria-label': 'klabo.world',
            },
            logoMark,
          ),
          createElement(
            'div',
            {
              style: {
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                opacity: 0.92,
              },
            },
            'klabo.world',
          ),
        ),
        createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
          createElement(
            'div',
            {
              style: {
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.06,
              },
            },
            'Notes, playbooks, and projects for shipping software.',
          ),
          createElement(
            'div',
            {
              style: {
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.35,
                color: 'rgba(226, 232, 240, 0.88)',
                maxWidth: 940,
              },
            },
            'Bitcoin · Lightning · Agentic engineering',
          ),
        ),
        createElement(
          'div',
          { style: { display: 'flex', gap: 12, marginTop: 'auto', flexWrap: 'wrap' } },
          ...['Writing', 'Projects', 'Tools'].map((label) =>
            createElement(
              'div',
              {
                key: label,
                style: {
                  borderRadius: 999,
                  border: '1px solid rgba(245,179,1,0.35)',
                  backgroundColor: 'rgba(245,179,1,0.12)',
                  padding: '10px 16px',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.92)',
                },
              },
              label,
            ),
          ),
          createElement(
            'div',
            {
              style: {
                marginLeft: 'auto',
                fontSize: 16,
                fontWeight: 650,
                letterSpacing: '0.12em',
                color: 'rgba(226, 232, 240, 0.72)',
              },
            },
            site.toString().replace(/\/$/, ''),
          ),
        ),
      ),
    ),
    { width: 1200, height: 630 },
  );
}
