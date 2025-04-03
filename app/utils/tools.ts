import { supabaseClient } from './supabase';
import { env } from './env';

interface DocumentResult {
  title: string;
  content: string;
  url: string;
  similarity: number;
}

// Define the type for Supabase document data
interface SupabaseDocument {
  title?: string;
  content: string;
  url?: string;
  similarity: number;
}

// Tool for searching React Router documentation
export const reactRouterDocsTool = {
  name: 'react_router_docs',
  description: 'Search the React Router documentation for information about specific features, concepts, or APIs.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for React Router documentation.',
      },
    },
    required: ['query'],
  },
  execute: async ({ query }: { query: string }) => {
    try {
      // Search for relevant documentation in the vector database
      const { data, error } = await supabaseClient.rpc('match_documents', {
        query_embedding: await getEmbedding(query),
        match_threshold: 0.5,
        match_count: 5,
      });

      if (error) {
        console.error('Error searching documentation:', error);
        return {
          content: 'Error searching documentation. Please try a different query.',
        };
      }

      if (!data || data.length === 0) {
        return {
          content:
            'No relevant documentation found for this query. Try a more general search term or check the official React Router documentation.',
        };
      }

      // Format the search results for the AI
      const results = data.map((doc: SupabaseDocument) => ({
        title: doc.title || 'React Router Documentation',
        content: doc.content,
        url: doc.url || 'https://reactrouter.com/docs/en/v7',
        similarity: doc.similarity,
      }));

      return {
        content: `Here are the most relevant documentation sections:\n\n${results
          .map((doc: DocumentResult) => `## ${doc.title}\n${doc.content}\n\nSource: ${doc.url}\n\n`)
          .join('\n')}`,
      };
    } catch (error) {
      console.error('Error in reactRouterDocsTool:', error);
      return {
        content: 'An error occurred while searching the documentation. Please try again later.',
      };
    }
  },
};

// Tool for web search
export const webSearchTool = {
  name: 'web_search',
  description: 'Search the web for current information about React Router or related technologies.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for the web search.',
      },
    },
    required: ['query'],
  },
  execute: async ({ query }: { query: string }) => {
    try {
      // Implement web search using a third-party service
      // This is a placeholder that would need to be implemented with a real service
      return {
        content: `Web search is not implemented yet. For now, I'll rely on my existing knowledge about React Router.`,
      };
    } catch (error) {
      console.error('Error in webSearchTool:', error);
      return {
        content: 'An error occurred while searching the web. Please try again later.',
      };
    }
  },
};

// Helper function to get embeddings from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
