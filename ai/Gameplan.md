# AI SDK Integration Gameplan for React Router Project

## Objective
Create an AI agent that integrates with our React Router project, capable of:
1. Researching the web for relevant information
2. Accessing an indexed version of React Router documentation
3. Providing helpful instructions to beginners

## Phase 1: Setup and Dependencies

### Required Packages
- `ai` - Core AI SDK package
- `@ai-sdk/react` - React hooks and components for AI interfaces
- `@ai-sdk/openai` - OpenAI integration for the AI SDK
- `@supabase/supabase-js` - For conversation memory, vector database and embeddings storage
- `shadcn/ui` - For building the chat interface components

### Environment Configuration
- Setup OpenAI API key
- Setup Supabase connection credentials
- Configure environment variables for both development and production

## Phase 2: Documentation Indexing

### Vector Database Setup
1. Create a Supabase vector database table
2. Design schema for storing documentation embeddings
3. Setup access control and security

### Documentation Processing
1. Scrape React Router documentation
2. Clean and process documentation content
3. Create embeddings using OpenAI's embedding model
4. Store embeddings in the Supabase vector database
5. Add metadata for better retrieval (section, category, URL)

### Retrieval System
1. Create a custom tool for AI SDK to query the vector database
2. Implement semantic search functionality using pgvector
3. Add relevance scoring to improve result quality
4. Build caching mechanism for frequently accessed content

## Phase 3: Web Search Tool

1. Implement a web search tool using the AI SDK tools API and third-party search service
2. Create a custom tool function that handles:
   - Query formatting
   - Result processing
   - Error handling
   - Rate limiting
3. Register the tool with the AI SDK agent

## Phase 4: AI Agent Implementation

### Route Setup
1. Create a new route in the React Router project for the AI assistant
2. Setup AI SDK API handlers for AI interactions
3. Implement streaming responses using React Router's streaming capabilities

### Agent Configuration
1. Define the agent's system prompt and instructions
2. Configure the available tools (web search and documentation retrieval)
3. Setup tool-calling capabilities using AI SDK
4. Implement conversation memory with Supabase

### AI API Handler as React Router Loader
```typescript
// Structure for the AI loader in routes/ai.tsx
export async function loader({ request }: Route.LoaderArgs) {
  // Get URL params or form data
  const url = new URL(request.url);
  const formData = await request.formData();
  const prompt = formData.get('prompt') || url.searchParams.get('prompt');
  
  // Get previous messages from Supabase
  const conversationId = url.searchParams.get('conversationId') || crypto.randomUUID();
  const { data: previousConversation } = await supabaseClient
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();
  
  // Prepare messages array
  const messages = previousConversation?.messages || 
    [{ role: 'system', content: 'You are a helpful assistant for React Router.' }];
  
  // Add user message if provided
  if (prompt) {
    messages.push({ role: 'user', content: prompt });
  }
  
  // Initialize AI with tools
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: [webSearchTool, reactRouterDocsTool],
  });
  
  // Store updated conversation
  await supabaseClient
    .from('conversations')
    .upsert({ 
      id: conversationId, 
      messages, 
      updated_at: new Date().toISOString() 
    });
  
  // Return streamed response
  return result.toDataStreamResponse();
}
```

## Phase 5: User Interface

### Chat Interface with Shadcn UI
Create a chat interface in `routes/ai.tsx` that leverages Shadcn UI components and AI SDK's hooks:

```typescript
import { useChat } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIAssistant({ loaderData }: Route.ComponentProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: loaderData?.initialMessages,
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>React Router Assistant</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto space-y-4 p-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-stone-500">
                Ask a question about React Router to get started.
              </p>
            </div>
          )}
          
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-start gap-2 max-w-[80%]">
                <Avatar>
                  <AvatarFallback>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </AvatarFallback>
                  <AvatarImage 
                    src={message.role === 'user' ? '/user-avatar.png' : '/ai-avatar.png'} 
                  />
                </Avatar>
                
                <div className={`rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-stone-500 text-white' 
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  {message.content}
                  
                  {/* Display tool usage if available */}
                  {message.parts?.map((part, index) => {
                    if (part.type === 'tool_use') {
                      return (
                        <div key={index} className="mt-2 p-2 text-xs bg-stone-200 dark:bg-stone-700 rounded">
                          <p className="font-semibold">Using tool: {part.name}</p>
                          <pre className="mt-1 overflow-auto">{JSON.stringify(part.input, null, 2)}</pre>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-2">
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
                <AvatarImage src="/ai-avatar.png" />
              </Avatar>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about React Router..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### React Router Integration
1. Add the new route in `app/routes.ts`:
```typescript
import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('ai', 'routes/ai.tsx'),
  route('api/chat', 'routes/api/chat.ts'),
] satisfies RouteConfig;
```

### Styling and UX
1. Style the interface using Shadcn UI and Tailwind CSS
2. Implement responsive design with mobile-first approach
3. Add loading states with skeleton components
4. Create visual differentiators for different response types (user, AI, tool usage)
5. Add support for markdown rendering in AI responses

## Phase 6: Testing and Refinement

1. Test the agent with various queries
2. Refine the system prompt based on response quality
3. Optimize the vector database for better retrieval
4. Collect user feedback and iterate

## Phase 7: Production Deployment

1. Optimize for production deployment
2. Implement monitoring and logging
3. Set up proper error handling
4. Configure Supabase for production performance

## Timeline
- Phase 1: 1 day
- Phase 2: 2-3 days
- Phase 3: 1 day
- Phase 4: 1-2 days
- Phase 5: 1-2 days
- Phase 6: 1-2 days
- Phase 7: 1 day

Total estimated time: 1-2 weeks
