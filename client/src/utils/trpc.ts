import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
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

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
