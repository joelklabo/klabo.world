import { ImageResponse } from 'next/og';
import { allPosts } from 'contentlayer/generated';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = { slug: string };

function clampText(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const resolvedParams = await Promise.resolve(params as Params);
  const post = allPosts.find((entry) => entry.slug === resolvedParams.slug);
  const title = clampText(post?.title ?? 'Post', 84);
  const summary = clampText(
    post?.summary ?? 'Read the latest writing on klabo.world.',
    180,
  );
  const tags = (post?.tags ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #070B14, #0B1326)',
          color: 'white',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(245,179,1,0.22), transparent 50%), radial-gradient(circle at 82% 18%, rgba(124,58,237,0.18), transparent 46%), radial-gradient(circle at 50% 92%, rgba(245,179,1,0.12), transparent 58%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            width: '100%',
            padding: '84px 92px',
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.18)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Post
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(226, 232, 240, 0.72)',
              }}
            >
              klabo.world
            </div>
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 850,
              letterSpacing: '-0.03em',
              lineHeight: 1.06,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'rgba(226, 232, 240, 0.88)',
              maxWidth: 980,
            }}
          >
            {summary}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 'auto', flexWrap: 'wrap' }}>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(245,179,1,0.35)',
                    backgroundColor: 'rgba(245,179,1,0.12)',
                    padding: '10px 14px',
                    fontSize: 14,
                    fontWeight: 750,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  {clampText(tag, 22)}
                </div>
              ))
            ) : (
              <div
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 750,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(226, 232, 240, 0.78)',
                }}
              >
                Writing
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
