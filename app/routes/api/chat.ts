import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { env } from '../../utils/env';
import { getConversation, saveConversation } from '../../utils/conversations';
import { reactRouterDocsTool, webSearchTool } from '../../utils/tools';
import crypto from 'node:crypto';

// Message type structure
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
};

// System prompt to define assistant behavior
const SYSTEM_PROMPT = `You are an AI assistant specialized in React Router. 
You provide helpful, accurate, and concise information about React Router concepts, APIs, and best practices.
Always provide code examples when relevant.
If you're not sure about something, admit it rather than making up information.
You have access to two tools:
1. react_router_docs - Use this to search React Router documentation for specific information
2. web_search - Use this for questions about current information that might not be in your training data

Use these tools when appropriate to provide the most accurate and helpful responses.`;

export async function loader() {
  return new Response('Method not allowed', { status: 405 });
}

export async function action({ request }: { request: Request }) {
  try {
    // Log environment for debugging
    console.log('OpenAI Key exists:', !!env.OPENAI_API_KEY);
    console.log('Key length:', env.OPENAI_API_KEY?.length);

    // Get URL search params to extract conversation ID
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Generate or use existing conversation ID
    const conversationId = searchParams.get('conversationId') || crypto.randomUUID();

    // Parse the request body
    const body = await request.json();
    const { messages } = body;

    console.log('Incoming messages:', JSON.stringify(messages.slice(-1)));

    // Try to get previous messages from Supabase
    let messageHistory: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    try {
      const existingConversation = await getConversation(conversationId);
      if (existingConversation?.messages) {
        messageHistory = existingConversation.messages as Message[];
      }
    } catch (error) {
      console.log('Unable to retrieve conversation, starting fresh');
      // Already initialized messageHistory with system prompt
    }

    // Add new user message if not already in history
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        // Just add the message
        messageHistory.push({
          role: 'user',
          content: lastUserMessage.content,
        });
      }
    }

    // Save the current conversation history to Supabase
    try {
      await saveConversation({
        id: conversationId,
        messages: messageHistory,
      });
    } catch (error) {
      console.log('Failed to save conversation but continuing');
    }

    // Create tools object with named properties
    const tools = {
      react_router_docs: reactRouterDocsTool,
      web_search: webSearchTool,
    };

    // Initialize OpenAI stream with message history and tools
    try {
      console.log('Starting OpenAI request with message count:', messageHistory.length);

      const result = streamText({
        model: openai('gpt-4o'),
        messages: messageHistory,
        temperature: 0.7,
        maxTokens: 1000,
        tools,
      });

      // Return the streaming response with conversation ID header
      return result.toDataStreamResponse({
        headers: {
          'X-Conversation-Id': conversationId,
        },
      });
    } catch (openaiError: unknown) {
      console.error('OpenAI API error:', openaiError);
      const errorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error';

      return new Response(
        JSON.stringify({
          error: 'OpenAI API Error',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
