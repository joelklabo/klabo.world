import { z } from 'zod';
import { getContexts, searchPublishedContexts, toContextMetadata } from '@/lib/contexts';
import { getFlag } from '@/lib/flags';
import { procedure, router, TRPCError } from '../trpc';

const requireFlag = (flagKey: string) =>
  procedure.use(async (opts) => {
    const evaluation = await getFlag(flagKey);
    if (evaluation.value !== true) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `${flagKey} disabled` });
    }
    return opts.next();
  });

export const contextsRouter = router({
  list: requireFlag('api-layer-pilot').query(() =>
    getContexts().map(toContextMetadata),
  ),
  search: requireFlag('api-layer-pilot')
    .input(
      z.object({
        q: z
          .string()
          .trim()
          .min(2, { message: 'Search query must be at least 2 characters.' }),
      }),
    )
    .query(({ input }) => searchPublishedContexts(input.q).map(toContextMetadata)),
});
