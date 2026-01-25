// 1. HANDLE BUTTON CLICKS (Interactive Messages)
// lib/whatsapp/handleInteractiveMessage.ts
// ============================================================================

export async function handleButtonClick(message: any): Promise<string> {
  const buttonReply = message.interactive?.button_reply;
  const listReply = message.interactive?.list_reply;

  if (buttonReply) {
    // User clicked a suggestion button
    const buttonId = buttonReply.id; // e.g., "suggestion_0"
    const buttonTitle = buttonReply.title;
    
    console.log(`[WhatsApp Bot] Button clicked: ${buttonTitle} (${buttonId})`);
    return buttonTitle; // Treat as a new query
  }

  if (listReply) {
    // User selected from a list
    const listId = listReply.id;
    const listTitle = listReply.title;
    
    console.log(`[WhatsApp Bot] List item selected: ${listTitle} (${listId})`);
    return listTitle;
  }

  return "";
}