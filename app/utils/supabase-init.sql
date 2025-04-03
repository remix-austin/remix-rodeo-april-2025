-- Function to create the conversations table if it doesn't exist
CREATE OR REPLACE FUNCTION create_conversations_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'conversations'
    ) THEN
        -- Create the conversations table
        CREATE TABLE public.conversations (
            id UUID PRIMARY KEY,
            messages JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add necessary indexes
        CREATE INDEX idx_conversations_updated_at ON public.conversations (updated_at DESC);
        
        -- Set up Row Level Security (RLS)
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        
        -- Create a policy to allow all operations for now
        -- In production, you would limit this to specific users/roles
        CREATE POLICY "Allow all operations for now" 
            ON public.conversations FOR ALL 
            USING (true) 
            WITH CHECK (true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable the pgvector extension if it's not already enabled
-- This is used for vector search capabilities
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update the updated_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'conversations_updated_at_trigger'
    ) THEN
        CREATE TRIGGER conversations_updated_at_trigger
        BEFORE UPDATE ON conversations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, do nothing
END $$ LANGUAGE plpgsql; 