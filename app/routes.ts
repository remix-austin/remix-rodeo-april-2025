import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('ai', 'routes/ai.tsx'),
  route('api/chat', 'routes/api/chat.ts'),
  route('api/test-openai', 'routes/api/test-openai.ts'),
  route('api/direct-chat', 'routes/api/direct-chat.ts'),
] satisfies RouteConfig;
