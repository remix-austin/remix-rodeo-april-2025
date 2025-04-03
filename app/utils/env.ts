// Environment variables accessor with type safety
const isServer = typeof process !== 'undefined' && process.versions && process.versions.node;

// Direct access to env variables in client and server
const getEnvValue = (serverVar: string, clientVar: string): string => {
  if (isServer) {
    return process.env[serverVar] || '';
  } else {
    return import.meta.env && import.meta.env[clientVar] ? (import.meta.env[clientVar] as string) : '';
  }
};

// Log environment status once at startup
console.log('Environment:', isServer ? 'Server' : 'Browser');
const openaiKey = getEnvValue('OPENAI_API_KEY', 'VITE_OPENAI_API_KEY');
console.log('OpenAI Key available:', !!openaiKey);
if (!openaiKey) {
  console.error('⚠️ MISSING OPENAI API KEY - Chat will not work');
}

export const env = {
  OPENAI_API_KEY: getEnvValue('OPENAI_API_KEY', 'VITE_OPENAI_API_KEY'),
  SUPABASE_URL: getEnvValue('SUPABASE_URL', 'VITE_SUPABASE_URL'),
  SUPABASE_KEY: getEnvValue('SUPABASE_KEY', 'VITE_SUPABASE_KEY'),
  NODE_ENV: isServer
    ? (process.env.NODE_ENV as 'development' | 'production' | 'test')
    : (import.meta.env?.MODE as 'development' | 'production' | 'test'),

  // Helper function to validate required environment variables
  validate: () => {
    if (isServer) {
      const requiredVars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'];

      const missingVars = requiredVars.filter((varName) => !process.env[varName]);

      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    } else {
      const requiredVars = ['VITE_OPENAI_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_KEY'];

      const missingVars = requiredVars.filter((varName) => !import.meta.env || !import.meta.env[varName]);

      if (missingVars.length > 0) {
        console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    }

    return true;
  },
};
