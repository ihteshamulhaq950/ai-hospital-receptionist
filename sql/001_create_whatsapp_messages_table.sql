-- ============================================================================
-- WhatsApp Messages Table Migration
-- This table stores all WhatsApp queries and their RAG-processed responses
-- ============================================================================

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL, -- Unique identifier for WhatsApp user
  message TEXT NOT NULL, -- User's query/message
  response TEXT, -- RAG-generated response (NULL until processed)
  needs_rag BOOLEAN DEFAULT TRUE, -- Whether RAG was needed for this query
  intent VARCHAR(50), -- Query intent from classifier (greeting, hospital_info, etc.)
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  context_used JSONB DEFAULT '[]'::jsonb, -- Array of sources/context items used
  sources_count INTEGER DEFAULT 0, -- Number of sources found
  processing_time_ms INTEGER, -- Time taken to process the query in milliseconds
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (user name, language, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for fast lookups
  CONSTRAINT whatsapp_messages_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number 
  ON whatsapp_messages(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status 
  ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at 
  ON whatsapp_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_created 
  ON whatsapp_messages(phone_number, created_at DESC);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_messages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the timestamp
DROP TRIGGER IF EXISTS whatsapp_messages_updated_at_trigger 
  ON whatsapp_messages;

CREATE TRIGGER whatsapp_messages_updated_at_trigger
BEFORE UPDATE ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_messages_timestamp();

-- ============================================================================
-- Sample queries for reference
-- ============================================================================

-- Insert a new message (when user sends a query)
-- INSERT INTO whatsapp_messages (phone_number, message, status, metadata)
-- VALUES ('+1234567890', 'What are your hospital timings?', 'pending', '{"name": "John Doe"}');

-- Update message with response (after RAG processing)
-- UPDATE whatsapp_messages
-- SET response = 'Your answer here...', 
--     needs_rag = true, 
--     intent = 'hospital_info', 
--     status = 'completed',
--     context_used = '[{"id": "doc-123", "score": 0.95}]',
--     sources_count = 1,
--     processing_time_ms = 1250
-- WHERE id = 'message-uuid';

-- Retrieve user's chat history
-- SELECT message, response, created_at 
-- FROM whatsapp_messages 
-- WHERE phone_number = '+1234567890' 
-- ORDER BY created_at DESC;
