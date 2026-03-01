# Quick Start - WhatsApp RAG Integration

## Step 1: Run Database Migration

Execute the SQL migration to create the `whatsapp_messages` table:

```sql
-- File: sql/001_create_whatsapp_messages_table.sql
-- Run this in your Supabase SQL Editor or database client

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  needs_rag BOOLEAN DEFAULT TRUE,
  intent VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  context_used JSONB DEFAULT '[]'::jsonb,
  sources_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT whatsapp_messages_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_created ON whatsapp_messages(phone_number, created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_messages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS whatsapp_messages_updated_at_trigger ON whatsapp_messages;
CREATE TRIGGER whatsapp_messages_updated_at_trigger
BEFORE UPDATE ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_messages_timestamp();
```

## Step 2: Set Environment Variables

Add these to your `.env.local`:

```env
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=<Get from Meta System User>
WHATSAPP_VERIFY_TOKEN=CareLink2025Secure!Token
WHATSAPP_PHONE_NUMBER_ID=<Get from WhatsApp Manager>
```

### Getting the Values:

**WHATSAPP_PHONE_NUMBER_ID:**
1. Go to Meta Business Suite
2. Select your WhatsApp Business Account
3. Go to WhatsApp Manager → Your Phone
4. Copy the "Phone number ID"

**WHATSAPP_ACCESS_TOKEN:**
1. Go to Meta Developers → Your App → Settings → Basic
2. Create a System User (if not exists)
3. Grant WhatsApp permissions
4. Generate permanent token
5. Copy the token

**WHATSAPP_VERIFY_TOKEN:**
- Use the default: `CareLink2025Secure!Token`
- Or create your own random string

## Step 3: Deploy Webhook

The webhook is already implemented at: `app/api/webhook/route.ts`

**No code changes needed!** Just deploy to production.

## Step 4: Configure in Meta Dashboard

1. Go to Meta Developers
2. Navigate to Your App → WhatsApp → Configuration
3. Click "Edit" on Webhook URL
4. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhook
   ```
5. Enter Verify Token:
   ```
   CareLink2025Secure!Token
   ```
6. Click "Verify and Save"
7. Subscribe to "messages" field

## Step 5: Test the Integration

### Option A: Use WhatsApp Test Number

1. Go to Meta Developers → Your App → WhatsApp → Getting Started
2. Find "Test Number" section
3. Click "Open WhatsApp"
4. Send a message:
   ```
   What are your hospital timings?
   ```
5. You should receive a RAG-powered response

### Option B: Add Real Phone Number

1. Go to Meta Developers → Your App → WhatsApp → Getting Started
2. Under "Manage Phone Number Numbers", add your number
3. Verify with code
4. Send messages and verify responses

### Option C: Local Testing with ngrok

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Terminal 3: Check webhook
curl "https://abc123.ngrok.io/api/webhook?hub.mode=subscribe&hub.verify_token=CareLink2025Secure!Token&hub.challenge=test_challenge"
```

## Step 6: Monitor Messages

```sql
-- View recent messages
SELECT phone_number, message, response, intent, processing_time_ms, created_at
FROM whatsapp_messages
ORDER BY created_at DESC
LIMIT 20;

-- View by status
SELECT status, COUNT(*) 
FROM whatsapp_messages 
GROUP BY status;

-- View specific user conversation
SELECT message, response, created_at
FROM whatsapp_messages
WHERE phone_number = '+1234567890'
ORDER BY created_at ASC;
```

## Key Features Implemented ✅

- [x] WhatsApp webhook verification
- [x] Message storage in dedicated table
- [x] RAG engine integration (no changes to existing RAG)
- [x] Query classification and intent tracking
- [x] Context source tracking
- [x] Processing time metrics
- [x] Error handling and fallback responses
- [x] Phone number as unique user identifier
- [x] Automatic timestamp management
- [x] Efficient database indexing
- [x] Structured logging
- [x] Production-grade error handling

## Data Structure Example

When a user sends "What are your OPD timings?", this record is created:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone_number": "+1234567890",
  "message": "What are your OPD timings?",
  "response": "Our OPD timings are...",
  "needs_rag": true,
  "intent": "hospital_info",
  "status": "completed",
  "context_used": [
    {
      "id": "doc-123",
      "score": 0.95,
      "page": 1
    },
    {
      "id": "doc-456",
      "score": 0.87,
      "page": 2
    }
  ],
  "sources_count": 2,
  "processing_time_ms": 1245,
  "metadata": {
    "user_name": "John Doe",
    "message_id": "wamid.123abc",
    "used_rag": true,
    "fallback": false
  },
  "created_at": "2024-03-01T10:30:45Z",
  "updated_at": "2024-03-01T10:30:47Z"
}
```

## Troubleshooting

**Problem:** "Failed to get hospital response"
- Check RAG logs
- Verify Pinecone connection
- Ensure hospital documents are indexed

**Problem:** "Missing WhatsApp credentials"
- Add environment variables
- Verify token hasn't expired
- Check phone number ID is correct

**Problem:** No response from WhatsApp
- Check network connectivity
- Verify webhook URL is accessible
- Check Meta API error logs
- Ensure credentials are valid

## Next Steps

1. Deploy to production
2. test with real WhatsApp numbers
3. Monitor message flow in database
4. Set up alerts for errors/failures
5. Consider adding interactive buttons
6. Build analytics dashboard

## Support

For issues refer to:
- [Full Documentation](./WHATSAPP_RAG_INTEGRATION.md)
- [RAG Integration Details](./WHATSAPP_RAG_INTEGRATION.md#rag-integration)
- [Troubleshooting Guide](./WHATSAPP_RAG_INTEGRATION.md#troubleshooting)
