import type { RouteGenerics } from '@react-router/dev/routes';

export type Route = RouteGenerics<{
  loader: {
    response: {
      initialMessages: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
      }>;
    };
  };
}>;
