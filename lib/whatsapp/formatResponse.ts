// 7. SMART RESPONSE FORMATTING
// lib/whatsapp/formatResponse.ts
// ============================================================================

/**
 * Format RAG response with WhatsApp markdown
 */
export function formatWhatsAppResponse(answer: string): string {
  return answer
    // Bold: *text*
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    // Italic: _text_
    .replace(/\*(.+?)\*/g, "_$1_")
    // Strikethrough: ~text~
    .replace(/~~(.+?)~~/g, "~$1~")
    // Code: ```text```
    .replace(/`([^`]+)`/g, "```$1```")
    // Clean up excessive line breaks
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Split long messages (WhatsApp max: ~4096 chars)
 */
export function splitLongMessage(message: string, maxLength = 4000): string[] {
  if (message.length <= maxLength) {
    return [message];
  }

  const parts: string[] = [];
  let remaining = message;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    // Try to split at a paragraph break
    let splitIndex = remaining.lastIndexOf("\n\n", maxLength);
    if (splitIndex === -1) {
      // Try to split at a sentence
      splitIndex = remaining.lastIndexOf(". ", maxLength);
    }
    if (splitIndex === -1) {
      // Force split at max length
      splitIndex = maxLength;
    }

    parts.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }

  return parts;
}
