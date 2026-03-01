# WhatsApp RAG Integration - Complete Documentation

## Overview

This document describes the production-grade WhatsApp webhook implementation that integrates with your RAG (Retrieval-Augmented Generation) system to provide intelligent responses to WhatsApp queries.

## Architecture

### Data Flow

```
WhatsApp User Message
    ↓
[1] Webhook Receives Message
    ↓
[2] Insert to whatsapp_messages (status: pending)
    ↓
[3] Update status to "processing"
    ↓
[4] Run RAG Engine (answerWithHospitalContext)
    ↓
[5] Update whatsapp_messages with:
    - response
    - needs_rag
    - intent
    - context_used
    - sources_count
    - processing_time_ms
    - status: completed
    ↓
[6] Send Response to WhatsApp
```

## Database Schema

### whatsapp_messages Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `phone_number` | TEXT | User's WhatsApp phone number (unique identifier) |
| `message` | TEXT | User's query/message |
| `response` | TEXT | RAG-generated response |
| `needs_rag` | BOOLEAN | Whether RAG was needed for this query |
| `intent` | VARCHAR(50) | Query intent (greeting, hospital_info, etc.) |
| `status` | VARCHAR(50) | Query status: pending → processing → completed |
| `context_used` | JSONB | Array of sources/context items used by RAG |
| `sources_count` | INTEGER | Number of sources found |
| `processing_time_ms` | INTEGER | Time taken to process (milliseconds) |
| `metadata` | JSONB | Additional metadata (user name, language, etc.) |
| `created_at` | TIMESTAMP | When the message was received |
| `updated_at` | TIMESTAMP | When the record was last updated |

### Indexes

- `idx_whatsapp_messages_phone_number` - Fast lookup by phone number
- `idx_whatsapp_messages_status` - Filter by processing status
- `idx_whatsapp_messages_created_at` - Sort by creation date
- `idx_whatsapp_messages_phone_created` - Combined index for efficient queries

## API Implementation Details

### File Location
`app/api/webhook/route.ts`

### GET Endpoint - Webhook Verification

**Purpose:** Verify webhook with WhatsApp

**Request:** Meta Dashboard sends verification challenge

**Response:** Returns challenge token if verification token matches

```typescript
GET /api/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

### POST Endpoint - Receive Messages

**Purpose:** Process incoming WhatsApp messages with RAG

**Request:** WhatsApp sends message in JSON format

**Response:** Always returns 200 OK (fire & forget pattern)

**Processing Steps:**

1. **Parse & Validate**
   - Ensure `object === 'whatsapp_business_account'`
   - Validate environment variables present

2. **Extract Message Data**
   - Phone number (from)
   - User name (if available in contacts)
   - Message text (only text messages)

3. **Store as Pending**
   ```sql
   INSERT INTO whatsapp_messages (phone_number, message, status)
   VALUES ('+1234567890', 'What are your timings?', 'pending')
   ```

4. **Run RAG Engine**
   - Call `answerWithHospitalContext()` with user message
   - Capture query intent and context sources
   - Handle errors with fallback response

5. **Update Record**
   ```sql
   UPDATE whatsapp_messages
   SET response = 'Answer here...',
       needs_rag = true,
       intent = 'hospital_info',
       status = 'completed',
       context_used = '[...]',
       sources_count = 2,
       processing_time_ms = 1250
   WHERE id = 'message-uuid'
   ```

6. **Send Response**
   - Send main answer
   - Send suggestions as follow-up (if any)

## Environment Variables

```env
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=<your_permanent_access_token>
WHATSAPP_VERIFY_TOKEN=<any_random_secure_string>
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
```

### Getting Credentials

1. **Phone Number ID**
   - Meta Business Suite → WhatsApp Manager → Your Phone
   - Copy the "Phone number ID"

2. **Access Token** (Permanent)
   - Meta Developers → Your App → WhatsApp
   - Create a System User
   - Generate permanent token
   - Grant necessary permissions

3. **Verify Token**
   - Create any random secure string
   - Use the same one in Meta Dashboard and environment variables

## RAG Integration

### Using Existing RAG Without Modification

The webhook uses your existing RAG function exactly as your web-based chat does:

```typescript
const result = await answerWithHospitalContext({
  content: userMessage.trim(),
  namespace: getHospitalNamespace(),
  topK: 3,
  onProgress: (stage, details) => {
    // Track RAG progress for debugging
    console.log(`[WhatsApp Bot] RAG Stage: ${stage}`, details);
  },
});
```

**Key Points:**
- No modifications to RAG code
- Same parameters as stream API
- Same response format
- Query classifier captures intent
- Context sources stored in database

## Unique User Identification

**Phone Number is the User Identifier**

```typescript
const userPhoneNumber = message.from; // e.g., '+1234567890'
```

This is stored in the `phone_number` column with a UNIQUE constraint, allowing you to:

1. **Track user conversations**
   ```sql
   SELECT * FROM whatsapp_messages 
   WHERE phone_number = '+1234567890'
   ORDER BY created_at DESC
   ```

2. **Build conversation history**
   ```sql
   SELECT message, response, created_at 
   FROM whatsapp_messages 
   WHERE phone_number = '+1234567890'
   ```

3. **Analyze user patterns**
   ```sql
   SELECT intent, COUNT(*) 
   FROM whatsapp_messages 
   WHERE phone_number = '+1234567890'
   GROUP BY intent
   ```

## Production Features

### Error Handling
- Graceful fallback if RAG fails
- Errors stored in metadata
- User-friendly error messages
- Prevents infinite retries

### Logging
- Structured logging with `[WhatsApp Bot]` prefix
- Progress tracking at each stage
- Integration with RAG progress callbacks
- Processing time metrics

### Performance Optimization
- Fire & forget for non-critical operations
- Parallel message processing
- Efficient database indexing
- 45-second timeout for RAG processing

### Security
- Environment variable validation
- WhatsApp business account verification
- Phone number validation
- Error details not exposed to user

## Monitoring & Analytics

### Key Metrics to Track

1. **Query Intent Distribution**
   ```sql
   SELECT intent, COUNT(*) as count 
   FROM whatsapp_messages 
   WHERE status = 'completed'
   GROUP BY intent
   ```

2. **RAG Effectiveness**
   ```sql
   SELECT 
     AVG(sources_count) as avg_sources,
     COUNT(CASE WHEN sources_count > 0 THEN 1 END) as rag_used_count,
     COUNT(*) as total_queries
   FROM whatsapp_messages
   ```

3. **Processing Time**
   ```sql
   SELECT 
     AVG(processing_time_ms) as avg_time,
     MAX(processing_time_ms) as max_time,
     MIN(processing_time_ms) as min_time
   FROM whatsapp_messages
   WHERE status = 'completed'
   ```

4. **User Engagement**
   ```sql
   SELECT 
     phone_number,
     COUNT(*) as message_count,
     MAX(created_at) as last_message
   FROM whatsapp_messages
   GROUP BY phone_number
   ORDER BY message_count DESC
   ```

## Testing

### Local Testing with ngrok

1. **Install ngrok**
   ```bash
   # On Windows
   choco install ngrok
   
   # Or download from https://ngrok.com
   ```

2. **Start your development server**
   ```bash
   npm run dev
   ```

3. **Expose with ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Configure in Meta Dashboard**
   - Go to Meta Developers → Your App → WhatsApp → Configuration
   - Callback URL: `https://abc123.ngrok.io/api/webhook`
   - Verify Token: `CareLink2025Secure!Token`
   - Subscribe to "messages" field

5. **Test Message**
   ```
   Send any message from your WhatsApp test number
   Expected: Receive response with hospital information
   ```

### Database Testing

```sql
-- Check pending messages
SELECT COUNT(*) FROM whatsapp_messages WHERE status = 'pending';

-- Check recent responses
SELECT phone_number, message, response, processing_time_ms 
FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for errors
SELECT id, phone_number, message, metadata->>'error' as error
FROM whatsapp_messages 
WHERE metadata->>'fallback' = 'true';
```

## Troubleshooting

### Issue: "Missing WhatsApp credentials"
- **Solution:** Ensure `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set in environment variables

### Issue: No response from WhatsApp
- **Solution:** Check Meta Developers dashboard logs for API errors
- Verify access token hasn't expired
- Verify phone number ID is correct and approved

### Issue: RAG always returns fallback
- **Solution:** Check RAG console logs for errors
- Verify Pinecone namespace exists
- Check hospital documents are indexed

### Issue: High processing time (>30s)
- **Solution:** Consider increasing `topK` parameter or optimizing RAG retrieval
- Check database performance
- Review Pinecone query latency

## Future Enhancements

1. **Interactive Buttons**
   - Send suggested questions as clickable buttons
   - Track button click analytics

2. **Rich Messages**
   - Send formatted messages with images
   - Send documents when relevant

3. **Async Processing**
   - Handle messages longer than 45 seconds
   - Use message queue for bulk processing

4. **User Preferences**
   - Store language preferences
   - Track interaction patterns
   - Personalized responses

5. **Conversation Context**
   - Build multi-turn conversations
   - Maintain conversation history
   - Context-aware responses

## File Locations

| File | Purpose |
|------|---------|
| `app/api/webhook/route.ts` | Main webhook implementation |
| `sql/001_create_whatsapp_messages_table.sql` | Database migration |
| `lib/rag/answerWithHospitalContext.ts` | RAG engine (unchanged) |
| `.env.local` | Environment variables |

## Summary

This implementation provides:
- ✅ Production-grade WhatsApp webhook
- ✅ RAG engine integration without modification
- ✅ Persistent message storage with full audit trail
- ✅ Query classification and intent tracking
- ✅ Source attribution and context tracking
- ✅ Error handling and fallback responses
- ✅ Performance monitoring and metrics
- ✅ Phone number as unique user identifier
- ✅ Comprehensive logging for debugging
