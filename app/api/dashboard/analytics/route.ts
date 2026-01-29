// app/api/dashboard/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import {getDashboardAuth} from "@/lib/auth/dashboardAuth";

type TimeRange = "today" | "yesterday" | "last4days" | "week" | "overall";

interface DailyAnalytics {
  date_day: string;
  day_name: string;
  query_count: number;
  satisfaction_score: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const auth = await getDashboardAuth();
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        {status: 400}
      ) 
    }

    const { supabase } = auth;
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get("range") || "week") as TimeRange;

    const { startDate, endDate } = getDateRange(range);

    console.log(`[ANALYTICS] Fetching ${range} analytics from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Execute all queries in parallel for maximum performance
    const [summaryResult, dailyResult, intentResult] = await Promise.all([
      supabase.rpc("get_analytics_summary", {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
      supabase.rpc("get_daily_analytics", {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }),
      supabase.rpc("get_intent_sample", {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        sample_limit: 1000,
      }),
    ]);

    // Handle errors
    if (summaryResult.error) {
      console.error("[ANALYTICS] Summary error:", summaryResult.error);
      throw new Error("Failed to fetch summary");
    }

    if (dailyResult.error) {
      console.error("[ANALYTICS] Daily analytics error:", dailyResult.error);
      throw new Error("Failed to fetch daily analytics");
    }

    if (intentResult.error) {
      console.error("[ANALYTICS] Intent sample error:", intentResult.error);
      throw new Error("Failed to fetch intent sample");
    }

    const summary = summaryResult.data || {};
    const dailyData = (dailyResult.data || []) as DailyAnalytics[];
    const intentSample = (intentResult.data || []) as Array<{ content_text: string }>;

    const totalQueries = summary.total_queries || 0;
    const hasData = totalQueries > 0;

    // Return empty state if no data
    if (!hasData) {
      console.log(`[ANALYTICS] No data found for ${range}`);
      return NextResponse.json({
        stats: {
          totalQueries: 0,
          avgDailyQueries: 0,
          topIntent: { name: "N/A", percentage: 0 },
          userSatisfaction: 0,
        },
        weeklyVolume: [],
        intentDistribution: [],
        satisfactionTrend: [],
        hasData: false,
        executionTime: Date.now() - startTime,
      });
    }

    // Calculate statistics
    const days = calculateDays(range);
    const avgDailyQueries = Math.round(totalQueries / days);

    const totalFeedback = summary.total_feedback || 0;
    const positiveFeedback = summary.positive_feedback || 0;
    const userSatisfaction = totalFeedback > 0
      ? Math.round((positiveFeedback / totalFeedback) * 100)
      : 0;

    // Process daily data for charts
    const { weeklyVolume, satisfactionTrend } = processDailyData(dailyData, range);

    // Process intent distribution
    const intentDistribution = processIntentDistribution(intentSample, totalQueries);

    const topIntent = intentDistribution.length > 0
      ? {
          name: intentDistribution[0].intent,
          percentage: Math.round((intentDistribution[0].count / totalQueries) * 100),
        }
      : { name: "N/A", percentage: 0 };

    const executionTime = Date.now() - startTime;
    console.log(`[ANALYTICS] Completed in ${executionTime}ms`);

    return NextResponse.json({
      stats: {
        totalQueries,
        avgDailyQueries,
        topIntent,
        userSatisfaction,
      },
      weeklyVolume,
      intentDistribution: intentDistribution.slice(0, 5),
      satisfactionTrend,
      hasData: true,
      executionTime,
    });
  } catch (error: any) {
    console.error("[ANALYTICS] Error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        hasData: false 
      },
      { status: 500 }
    );
  }
}

function getDateRange(range: TimeRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "last4days":
      startDate.setDate(startDate.getDate() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "overall":
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

function calculateDays(range: TimeRange): number {
  const map: Record<TimeRange, number> = {
    today: 1,
    yesterday: 1,
    last4days: 4,
    week: 7,
    overall: 90,
  };
  return map[range] || 7;
}

function processDailyData(dailyData: DailyAnalytics[], range: TimeRange) {
  const dayLabels = getDayLabels(range);
  const dataMap = new Map<string, DailyAnalytics>();

  // Create map for quick lookup
  dailyData.forEach((item) => {
    dataMap.set(item.day_name, item);
  });

  // Fill in all days with data or zeros
  const weeklyVolume = dayLabels.map((day) => {
    const data = dataMap.get(day);
    return {
      day,
      queries: data?.query_count || 0,
      satisfaction: data?.satisfaction_score || 0,
    };
  });

  const satisfactionTrend = dayLabels.map((day) => {
    const data = dataMap.get(day);
    return {
      day,
      satisfaction: data?.satisfaction_score || 0,
    };
  });

  return { weeklyVolume, satisfactionTrend };
}

function getDayLabels(range: TimeRange): string[] {
  if (range === "last4days") {
    const labels: string[] = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
  }
  
  // For week/overall, return proper day sequence
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return labels;
}

function processIntentDistribution(
  messages: Array<{ content_text: string }>,
  totalQueries: number
) {
  if (messages.length === 0) return [];

  const intentCounts: { [key: string]: number } = {};

  messages.forEach((msg) => {
    const intent = detectIntent(msg.content_text);
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  });

  // Calculate extrapolation factor
  const sampleSize = messages.length;
  const scaleFactor = totalQueries / sampleSize;

  const sorted = Object.entries(intentCounts)
    .map(([intent, count]) => ({
      intent,
      count: Math.round(count * scaleFactor),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return sorted.map((item, i) => ({
    ...item,
    color: colors[i] || colors[0],
  }));
}

function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  const intentKeywords: { [key: string]: string[] } = {
    Appointment: ["appointment", "schedule", "book", "visit", "meeting", "consultation"],
    Medication: ["medication", "medicine", "prescription", "drug", "pill", "pharmacy"],
    Diagnosis: ["diagnosis", "symptom", "condition", "disease", "sick", "pain", "treatment"],
    Billing: ["bill", "payment", "insurance", "cost", "charge", "pay", "invoice"],
  };

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return intent;
    }
  }

  return "General";
}


