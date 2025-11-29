import { contextsRouter } from './routers/contexts';
import { router } from './trpc';

export const appRouter = router({
  contexts: contextsRouter,
});

export type AppRouter = typeof appRouter;
