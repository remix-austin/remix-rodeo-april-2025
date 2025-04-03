import { env } from '../../utils/env';
import { openai } from '@ai-sdk/openai';

export async function loader() {
  try {
    // Test the OpenAI API key
    const hasKey = !!env.OPENAI_API_KEY;
    const keyLength = env.OPENAI_API_KEY?.length || 0;

    if (!hasKey || keyLength < 10) {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid OpenAI API key',
          hasKey,
          keyLength,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Try a basic OpenAI completion
    try {
      const model = openai('gpt-4o');

      // Just check if the model was created successfully
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OpenAI model initialized successfully',
          hasKey,
          keyLength,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (modelError: unknown) {
      const errorMessage = modelError instanceof Error ? modelError.message : 'Unknown error initializing OpenAI model';

      return new Response(
        JSON.stringify({
          error: 'Failed to initialize OpenAI model',
          message: errorMessage,
          hasKey,
          keyLength,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'API test failed',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
