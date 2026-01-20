// app/api/dashboard/analytics/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // Define 7-day range
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const isoSevenDaysAgo = sevenDaysAgo.toISOString();

    // -----------------------------
    // 1️⃣ Total queries
    // -----------------------------
    const { count: totalQueries } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoSevenDaysAgo);

    // -----------------------------
    // 2️⃣ Weekly queries & satisfaction
    // -----------------------------
    const { data: weeklyData } = await supabase
      .from("chat_messages")
      .select(
        `
        created_at,
        user_feedback,
        content_json
      `
      )
      .gte("created_at", isoSevenDaysAgo);

    // Initialize weekly map
    const weekDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const weeklyMap: Record<string, { count: number; satisfactionSum: number; satisfactionCount: number }> = {};
    weekDays.forEach(day => weeklyMap[day] = { count: 0, satisfactionSum: 0, satisfactionCount: 0 });

    // Count by day and compute satisfaction
    weeklyData?.forEach(msg => {
      const day = weekDays[new Date(msg.created_at).getDay()];
      weeklyMap[day].count += 1;

      if (msg.user_feedback !== null && msg.user_feedback !== undefined) {
        let value = 0;
        if (msg.user_feedback === 1) value = 100;
        else if (msg.user_feedback === 0) value = 50;
        else value = 0;

        weeklyMap[day].satisfactionSum += value;
        weeklyMap[day].satisfactionCount += 1;
      }
    });

    const weeklyQueries = weekDays.map(day => {
      const { count, satisfactionSum, satisfactionCount } = weeklyMap[day];
      return {
        day,
        count,
        satisfaction: satisfactionCount ? Math.round(satisfactionSum / satisfactionCount) : 0
      };
    });

    // -----------------------------
    // 3️⃣ Intent distribution
    // -----------------------------
    const intentCounts: Record<string, number> = {};

    weeklyData?.forEach(msg => {
      const intent = msg.content_json?.[0] || "General";
      if (!intentCounts[intent]) intentCounts[intent] = 0;
      intentCounts[intent] += 1;
    });

    const intentDistribution = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count);

    // -----------------------------
    // 4️⃣ Summary stats
    // -----------------------------
    // Avg daily queries
    const avgDailyQueries = totalQueries ? Math.round(totalQueries / 7) : 0;

    // Top intent
    const topIntent = intentDistribution[0] || { intent: "N/A", count: 0 };
    const topIntentPercentage = totalQueries ? Math.round((topIntent.count / totalQueries) * 100) : 0;

    // User satisfaction overall
    let totalSatisfactionSum = 0;
    let totalSatisfactionCount = 0;
    weeklyData?.forEach(msg => {
      if (msg.user_feedback !== null && msg.user_feedback !== undefined) {
        let value = 0;
        if (msg.user_feedback === 1) value = 100;
        else if (msg.user_feedback === 0) value = 50;
        else value = 0;

        totalSatisfactionSum += value;
        totalSatisfactionCount += 1;
      }
    });

    const userSatisfaction = totalSatisfactionCount
      ? Math.round(totalSatisfactionSum / totalSatisfactionCount)
      : 0;

    // -----------------------------
    // 5️⃣ Return JSON response
    // -----------------------------
    return NextResponse.json({
      success: true,
      summary: {
        totalQueries: totalQueries || 0,
        avgDailyQueries,
        topIntent: {
          name: topIntent.intent,
          percentage: topIntentPercentage
        },
        userSatisfaction: {
          value: userSatisfaction,
          delta: 0 // optional: compute vs previous period
        }
      },
      weeklyQueries,
      intentDistribution,
      meta: {
        range: "last_7_days",
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
