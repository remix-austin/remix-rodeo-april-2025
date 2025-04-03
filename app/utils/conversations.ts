import { supabaseClient } from './supabase';

// Interface for storing conversation data
export interface Conversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Skip initialization - table already exists
 */
export async function initConversationsTable() {
  // Table already exists, no need to initialize
  console.log('Using existing conversations table');
  return true;
}

/**
 * Retrieves a conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabaseClient.from('conversations').select('*').eq('id', id).single();

    if (error) {
      console.log('Starting new conversation');
      return null;
    }

    return data as Conversation;
  } catch (err) {
    console.log('Error fetching conversation, starting new one');
    return null;
  }
}

/**
 * Saves a conversation to Supabase
 */
export async function saveConversation(conversation: Conversation): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('conversations').upsert({
      id: conversation.id,
      messages: conversation.messages,
      updated_at: new Date().toISOString(),
      created_at: conversation.created_at || new Date().toISOString(),
    });

    if (error) {
      console.log('Chat will continue but history not saved:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.log('Chat will continue but history not saved');
    return false;
  }
}

/**
 * Deletes a conversation by ID
 */
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('conversations').delete().eq('id', id);

    if (error) {
      console.log('Could not delete conversation:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.log('Could not delete conversation');
    return false;
  }
}

/**
 * Lists conversations, ordered by most recent
 */
export async function listConversations(limit = 10): Promise<Conversation[]> {
  try {
    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('Could not list conversations');
      return [];
    }

    return data as Conversation[];
  } catch (err) {
    console.log('Could not list conversations');
    return [];
  }
}
