"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  MessageSquare,
  Users,
  BrainCircuit,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TimeRange = "today" | "yesterday" | "last4days" | "week" | "overall";

interface AnalyticsData {
  stats: {
    totalQueries: number;
    avgDailyQueries: number;
    topIntent: { name: string; percentage: number };
    userSatisfaction: number;
  };
  weeklyVolume: Array<{ day: string; queries: number; satisfaction: number }>;
  intentDistribution: Array<{ intent: string; count: number; color: string }>;
  satisfactionTrend: Array<{ day: string; satisfaction: number }>;
  hasData: boolean;
  executionTime?: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/analytics?range=${timeRange}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const result = await response.json();
      setData(result);

      if (result.executionTime) {
        console.log(`[ANALYTICS_UI] Loaded in ${result.executionTime}ms`);
      }
    } catch (err: any) {
      console.error("[ANALYTICS_UI] Fetch error:", err);
      setError(err.message || "Unable to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Error State - Full page error
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Error Loading Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchAnalytics} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No Data State
  if (!loading && data && !data.hasData) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Queries Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor patient interactions and AI performance metrics.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex flex-wrap gap-2">
          {(["today", "yesterday", "last4days", "week", "overall"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "today" && "Today"}
              {range === "yesterday" && "Yesterday"}
              {range === "last4days" && "Last 4"}
              {range === "week" && "Week"}
              {range === "overall" && "Overall"}
            </Button>
          ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No chat messages found for {timeRange === "week" ? "the past week" : timeRange}.
              Start conversations to see analytics here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Page with Skeleton Loaders
  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Queries Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor patient interactions and AI performance metrics.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex flex-wrap gap-2">
        {(["today", "yesterday", "last4days", "week", "overall"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            disabled={loading}
          >
            {range === "today" && "Today"}
            {range === "yesterday" && "Yesterday"}
            {range === "last4days" && "Last 4"}
            {range === "week" && "Week"}
            {range === "overall" && "Overall"}
          </Button>
        ))}
      </div>

      {/* Stats Cards with Skeleton Loaders */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Queries Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.totalQueries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">User messages in period</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Daily Queries Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Daily Queries</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.stats.avgDailyQueries.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average per day</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Intent Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Top Intent</CardTitle>
            <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.topIntent.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.stats.topIntent.percentage}% of queries
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* User Satisfaction Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-36" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.userSatisfaction}%</div>
                <p className="text-xs text-muted-foreground mt-1">Positive feedback rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts with Skeleton Loaders */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Query Volume Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Query Volume</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Number of queries received in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.weeklyVolume.length && data.weeklyVolume.some((d) => d.queries > 0) ? (
              <ChartContainer
                config={{
                  queries: {
                    label: "Queries",
                    color: "hsl(220 70% 50%)",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyVolume}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="queries" fill="var(--color-queries)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No query data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intent Distribution Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Intent Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Most frequent topics patients are asking about
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.intentDistribution.length ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(160 60% 45%)",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.intentDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="intent"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No intent data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Trend Chart */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">AI Satisfaction Score</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Patient feedback trends based on AI response quality
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 sm:h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.satisfactionTrend.some((d) => d.satisfaction > 0) ? (
              <ChartContainer
                config={{
                  satisfaction: {
                    label: "Satisfaction %",
                    color: "hsl(142 76% 36%)",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="var(--color-satisfaction)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-satisfaction)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Users className="w-8 h-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No satisfaction data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users haven't provided feedback
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Note */}
      {!loading && data?.executionTime && (
        <p className="text-xs text-muted-foreground text-center">
          Analytics loaded in {data.executionTime}ms
        </p>
      )}
    </div>
  );
}
