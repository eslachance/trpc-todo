import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/router';

// Create TRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create TRPC client configuration
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});

export type RouterInputs = Parameters<AppRouter['_def']['procedures'][keyof AppRouter['_def']['procedures']]['call']>[0];
export type RouterOutputs = Awaited<ReturnType<AppRouter['_def']['procedures'][keyof AppRouter['_def']['procedures']]['call']>>;
