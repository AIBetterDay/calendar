import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Host } from '@better/connector-sdk-web';
import { TodoPage } from './pages/TodoPage.js';
import { makeTodoApi } from './lib/api.js';

interface AppProps {
  host: Host;
}

export function App({ host }: AppProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5_000, retry: false, refetchOnWindowFocus: false },
        },
      }),
    [],
  );
  const api = useMemo(() => makeTodoApi(host), [host]);

  return (
    <QueryClientProvider client={queryClient}>
      <TodoPage api={api} />
    </QueryClientProvider>
  );
}
