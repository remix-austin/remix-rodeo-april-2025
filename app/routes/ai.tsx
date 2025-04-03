'use client';

import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";

// Message type
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function loader() {
  return { initialMessages: [] };
}

export function action() {
  return null;
}

export default function AIAssistant() {
  // State for chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlConversationId = urlParams.get('conversationId');

    if (urlConversationId) {
      setConversationId(urlConversationId);
      // Store in localStorage for future visits
      localStorage.setItem('aiConversationId', urlConversationId);
    } else {
      // Check localStorage
      const storedConversationId = localStorage.getItem('aiConversationId');
      if (storedConversationId) {
        setConversationId(storedConversationId);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call our direct-chat API
      const response = await fetch(`/api/direct-chat${conversationId ? `?conversationId=${conversationId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Get conversation ID from headers if not set
      const responseConversationId = response.headers.get('X-Conversation-Id');
      if (responseConversationId && !conversationId) {
        setConversationId(responseConversationId);
        localStorage.setItem('aiConversationId', responseConversationId);

        // Update URL with conversation ID without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('conversationId', responseConversationId);
        window.history.pushState({}, '', url.toString());
      }

      // Add AI response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    localStorage.removeItem('aiConversationId');
    setConversationId(null);
    setMessages([]);

    // Update URL by removing conversationId
    const url = new URL(window.location.href);
    url.searchParams.delete('conversationId');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>React Router Assistant</CardTitle>
          <Button
            variant="outline"
            onClick={startNewConversation}
            disabled={isLoading}
          >
            New Chat
          </Button>
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
                </Avatar>

                <div className={`rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-stone-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2">
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
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