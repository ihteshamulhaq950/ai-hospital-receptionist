// 8. ANALYTICS & MONITORING
// lib/whatsapp/analytics.ts
// ============================================================================

export async function logWhatsAppInteraction(data: {
  userId: string;
  phoneNumber: string;
  messageType: "incoming" | "outgoing";
  intent?: string;
  usedRAG: boolean;
  responseTime?: number;
}): Promise<void> {
  const supabase = await import("@/lib/supabase/server").then((m) => m.createClient());

  await (await supabase).from("whatsapp_analytics").insert({
    user_id: data.userId,
    phone_number: data.phoneNumber,
    message_type: data.messageType,
    query_intent: data.intent,
    used_rag: data.usedRAG,
    response_time_ms: data.responseTime,
    timestamp: new Date().toISOString(),
  });
}

// Get WhatsApp bot metrics
export async function getWhatsAppMetrics(
  startDate: Date,
  endDate: Date
): Promise<any> {
  const supabase = await import("@/lib/supabase/server").then((m) => m.createClient());

  const { data, error } = await (await supabase)
    .from("whatsapp_analytics")
    .select("*")
    .gte("timestamp", startDate.toISOString())
    .lte("timestamp", endDate.toISOString());

  if (error) throw error;

  return {
    totalMessages: data.length,
    incomingMessages: data.filter((d) => d.message_type === "incoming").length,
    outgoingMessages: data.filter((d) => d.message_type === "outgoing").length,
    ragUsageRate: (data.filter((d) => d.used_rag).length / data.length) * 100,
    avgResponseTime:
      data.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / data.length,
    topIntents: getTopIntents(data),
  };
}

function getTopIntents(data: any[]): Record<string, number> {
  const intents: Record<string, number> = {};
  data.forEach((d) => {
    if (d.query_intent) {
      intents[d.query_intent] = (intents[d.query_intent] || 0) + 1;
    }
  });
  return intents;
}