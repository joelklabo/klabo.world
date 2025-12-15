import { ImageResponse } from 'next/og';
import { allPosts } from 'contentlayer/generated';
import { createElement } from 'react';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Params = { slug: string };

function clampText(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export async function GET(_req: Request, context: { params: Params | Promise<Params> }) {
  const resolvedParams = await Promise.resolve(context.params as Params);
  const post = allPosts.find((entry) => entry.slug === resolvedParams.slug);
  const title = clampText(post?.title ?? 'Post', 84);
  const summary = clampText(post?.summary ?? 'Read the latest writing on klabo.world.', 180);
  const tags = (post?.tags ?? []).slice(0, 4);

  const site = new URL(env.SITE_URL);
  site.pathname = '';

  const logoMark = createElement(
    'svg',
    { width: 30, height: 30, viewBox: '0 0 512 512', fill: 'none' },
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
          background: 'linear-gradient(180deg, #070B14, #0B1326)',
          color: 'white',
        },
      },
      createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(245,179,1,0.22), transparent 50%), radial-gradient(circle at 82% 18%, rgba(124,58,237,0.18), transparent 46%), radial-gradient(circle at 50% 92%, rgba(245,179,1,0.12), transparent 58%)',
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
            gap: 26,
          },
        },
        createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 } },
          createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 14 } },
            createElement(
              'div',
              {
                style: {
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                },
              },
              'Post',
            ),
            createElement(
              'div',
              {
                style: {
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(226, 232, 240, 0.72)',
                },
              },
              'klabo.world',
            ),
          ),
          createElement(
            'div',
            {
              style: {
                width: 46,
                height: 46,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #F5B301, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
              },
              'aria-label': 'klabo.world',
            },
            logoMark,
          ),
        ),
        createElement(
          'div',
          {
            style: {
              fontSize: 64,
              fontWeight: 850,
              letterSpacing: '-0.03em',
              lineHeight: 1.06,
            },
          },
          title,
        ),
        createElement(
          'div',
          {
            style: {
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'rgba(226, 232, 240, 0.88)',
              maxWidth: 980,
            },
          },
          summary,
        ),
        createElement(
          'div',
          { style: { display: 'flex', gap: 12, marginTop: 'auto', flexWrap: 'wrap' } },
          ...(tags.length
            ? tags.map((tag) =>
                createElement(
                  'div',
                  {
                    key: tag,
                    style: {
                      borderRadius: 999,
                      border: '1px solid rgba(245,179,1,0.35)',
                      backgroundColor: 'rgba(245,179,1,0.12)',
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 750,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.92)',
                    },
                  },
                  clampText(tag, 22),
                ),
              )
            : [
                createElement(
                  'div',
                  {
                    key: 'writing',
                    style: {
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 750,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(226, 232, 240, 0.78)',
                    },
                  },
                  'Writing',
                ),
              ]),
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
