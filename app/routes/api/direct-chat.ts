import { env } from '../../utils/env';
import crypto from 'node:crypto';
import { getConversation, saveConversation } from '../../utils/conversations';

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
If you're not sure about something, admit it rather than making up information.`;

export async function loader() {
  return new Response('Method not allowed', { status: 405 });
}

export async function action({ request }: { request: Request }) {
  try {
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
    }

    // Add new user message if not already in history
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        messageHistory.push({
          role: 'user',
          content: lastUserMessage.content,
        });
      }
    }

    // Directly call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messageHistory,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      return new Response(
        JSON.stringify({
          error: 'OpenAI API Error',
          details: errorData,
        }),
        {
          status: openaiResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the response
    const result = await openaiResponse.json();

    // Extract the assistant's message
    const assistantMessage = result.choices[0].message;

    // Add the assistant's response to the conversation history
    messageHistory.push({
      role: 'assistant',
      content: assistantMessage.content,
    });

    // Save the updated conversation history to Supabase
    try {
      await saveConversation({
        id: conversationId,
        messages: messageHistory,
      });
    } catch (error) {
      console.log('Failed to save conversation but continuing');
    }

    // Return the response
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Conversation-Id': conversationId,
        },
      }
    );
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
