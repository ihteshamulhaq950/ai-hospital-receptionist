"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/types/dashboard";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

// Skeleton Components
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

function RecentUploadsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Empty State Components
function EmptyRecentUploads() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
        <div className="relative bg-muted/50 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
          <Inbox className="h-12 w-12 text-muted-foreground/40" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Upload your first medical PDF to start building your knowledge base and
        enable intelligent patient query responses.
      </p>
      <Button asChild size="sm" className="gap-2">
        <Link href="/dashboard/upload">
          <Upload className="h-4 w-4" />
          Upload Your First PDF
        </Link>
      </Button>
    </div>
  );
}

function EmptySystemPerformance() {
  return (
    <div className="h-75 flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
        <div className="relative">
          <Activity className="h-16 w-16 text-muted-foreground/30" />
        </div>
      </div>
      <h3 className="text-base font-semibold mb-2">
        Waiting for Activity
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        System performance metrics will appear here once you start processing
        documents and receiving patient queries.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const hasData = stats && (stats.totalDocuments > 0 || stats.recentUploads.length > 0);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="lg:sticky mt-1 lg:top-0 lg:z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b pb-4 -mx-6 px-6 pt-8 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hi Admin, welcome to your dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your medical knowledge base and monitor patient
              interactions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload PDF
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/pdf">
                <FileText className="mr-2 h-5 w-5" />
                View PDFs
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Documents
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalDocuments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.recentDocumentsCount && stats.recentDocumentsCount > 0
                    ? `+${stats.recentDocumentsCount} from last week`
                    : hasData
                    ? "No recent uploads"
                    : "Upload your first document"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Patient Queries
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.patientQueries || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasData ? "Total tracked queries" : "Awaiting first query"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Knowledge Chunks
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.totalChunks || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasData
                    ? "Across all embeddings"
                    : "Ready for processing"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasData ? "Current sessions" : "Waiting for users"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              Knowledge retrieval and response latency across the hospital
              network.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t">
            {loading ? (
              <div className="h-75 flex items-center justify-center">
                <div className="space-y-4 w-full px-8">
                  <div className="h-3 bg-muted animate-pulse rounded w-full" />
                  <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
                  <div className="h-3 bg-muted animate-pulse rounded w-4/6" />
                  <div className="h-3 bg-muted animate-pulse rounded w-3/6" />
                </div>
              </div>
            ) : (
              <EmptySystemPerformance />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>
              Latest medical documentation processed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <RecentUploadsSkeleton />
            ) : stats?.recentUploads && stats.recentUploads.length > 0 ? (
              <>
                <div className="space-y-6">
                  {stats.recentUploads.map((file) => (
                    <Link
                      key={file.id}
                      href={`/dashboard/pdf/${file.id}`}
                      className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted group-hover:bg-background transition-colors">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {file.pdf_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            file.document_chunks > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                          }`}
                        >
                          {file.document_chunks > 0 ? "Embedded" : "Processing"}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-6 text-primary"
                  asChild
                >
                  <Link href="/dashboard/pdf">View All Documents</Link>
                </Button>
              </>
            ) : (
              <EmptyRecentUploads />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Card - Only show when no data */}
      {!loading && !hasData && (
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Your dashboard is ready. Upload medical documents to start
                  building your AI-powered knowledge base for patient care.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/dashboard/upload">
                  Upload First Document
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import {
//   Upload,
//   FileText,
//   Activity,
//   Users,
//   MessageSquare,
//   TrendingUp,
//   Loader2,
// } from "lucide-react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import type { DashboardStats } from "@/types/dashboard";

// // Dummy data fallback
// const DUMMY_STATS: DashboardStats = {
//   totalDocuments: 24,
//   recentDocumentsCount: 2,
//   totalPages: 567,
//   totalChunks: 15400,
//   recentUploads: [
//     {
//       id: "1",
//       pdf_name: "Patient_Care_v2.pdf",
//       file_size: 2.4 * 1024 * 1024,
//       document_chunks: 156,
//     },
//     {
//       id: "2",
//       pdf_name: "Clinical_Trials.pdf",
//       file_size: 5.8 * 1024 * 1024,
//       document_chunks: 312,
//     },
//     {
//       id: "3",
//       pdf_name: "Medication_Guide.pdf",
//       file_size: 1.2 * 1024 * 1024,
//       document_chunks: 78,
//     },
//   ],
//   patientQueries: 1284,
//   activeUsers: 573,
// };

// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return "0 Bytes";
//   const k = 1024;
//   const sizes = ["Bytes", "KB", "MB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
// }

// function formatNumber(num: number): string {
//   if (num >= 1000) {
//     return (num / 1000).toFixed(1) + "k";
//   }
//   return num.toString();
// }

// export default function DashboardPage() {
//   const [stats, setStats] = useState<DashboardStats>(DUMMY_STATS);
//   const [loading, setLoading] = useState(true);
//   const [usingRealData, setUsingRealData] = useState(false);

//   useEffect(() => {
//     fetchDashboardStats();
//   }, []);

//   const fetchDashboardStats = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch("/api/dashboard");
//       const result = await response.json();

//       if (result.success && result.data) {
//         const fetchedData = result.data;

//         // Merge real data with dummy data (use dummy for null values)
//         setStats({
//           totalDocuments:
//             fetchedData.totalDocuments || DUMMY_STATS.totalDocuments,
//           recentDocumentsCount:
//             fetchedData.recentDocumentsCount ||
//             DUMMY_STATS.recentDocumentsCount,
//           totalPages: fetchedData.totalPages || DUMMY_STATS.totalPages,
//           totalChunks: fetchedData.totalChunks || DUMMY_STATS.totalChunks,
//           recentUploads:
//             fetchedData.recentUploads.length > 0
//               ? fetchedData.recentUploads
//               : DUMMY_STATS.recentUploads,
//           patientQueries:
//             fetchedData.patientQueries || DUMMY_STATS.patientQueries,
//           activeUsers: fetchedData.activeUsers || DUMMY_STATS.activeUsers,
//         });

//         // Check if we have any real data
//         setUsingRealData(
//           fetchedData.totalDocuments > 0 || fetchedData.recentUploads.length > 0
//         );
//       } else {
//         // Use dummy data on error
//         setStats(DUMMY_STATS);
//         setUsingRealData(false);
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard stats:", error);
//       // Use dummy data on error
//       setStats(DUMMY_STATS);
//       setUsingRealData(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Welcome Header */}
//       <div className="lg:sticky mt-1 lg:top-0 lg:z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b pb-4 -mx-6 px-6 pt-8 mb-6">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div className="space-y-1">
//             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
//               Hi Admin, welcome to your dashboard
//             </h1>
//             <p className="text-sm sm:text-base text-muted-foreground">
//               Manage your medical knowledge base and monitor patient
//               interactions.
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-3 shrink-0">
//             <Button
//               asChild
//               size="lg"
//               className="bg-primary hover:bg-primary/90"
//             >
//               <Link href="/dashboard/upload">
//                 <Upload className="mr-2 h-5 w-5" />
//                 Upload PDF
//               </Link>
//             </Button>
//             <Button asChild variant="outline" size="lg">
//               <Link href="/dashboard/pdf">
//                 <FileText className="mr-2 h-5 w-5" />
//                 View PDFs
//               </Link>
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Documents
//             </CardTitle>
//             <FileText className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             ) : (
//               <>
//                 <div className="text-2xl font-bold">{stats.totalDocuments}</div>
//                 <p className="text-xs text-muted-foreground">
//                   {stats.recentDocumentsCount > 0
//                     ? `+${stats.recentDocumentsCount} from last week`
//                     : "No recent uploads"}
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">
//               Patient Queries
//             </CardTitle>
//             <MessageSquare className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             ) : (
//               <>
//                 <div className="text-2xl font-bold">
//                   {formatNumber(stats.patientQueries || 0)}
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   {usingRealData
//                     ? "Tracked queries"
//                     : "Demo data - Coming soon"}
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">
//               Knowledge Chunks
//             </CardTitle>
//             <TrendingUp className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             ) : (
//               <>
//                 <div className="text-2xl font-bold">
//                   {formatNumber(stats.totalChunks)}
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   Across all embeddings
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">Active Users</CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//             ) : (
//               <>
//                 <div className="text-2xl font-bold">
//                   {stats.activeUsers || 0}
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   {usingRealData
//                     ? "Live interactions"
//                     : "Demo data - Coming soon"}
//                 </p>
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Activity Section */}
//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
//         <Card className="col-span-full lg:col-span-4">
//           <CardHeader>
//             <CardTitle>System Performance</CardTitle>
//             <CardDescription>
//               Knowledge retrieval and response latency across the hospital
//               network.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="h-75 flex items-center justify-center border-t pt-6">
//             <div className="text-center space-y-2">
//               <Activity className="h-12 w-12 text-primary/20 mx-auto" />
//               <p className="text-muted-foreground font-medium">
//                 Response Analytics Loading...
//               </p>
//               <p className="text-xs text-muted-foreground/60">
//                 Real-time vector search metrics
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="col-span-full lg:col-span-3">
//           <CardHeader>
//             <CardTitle>Recent Uploads</CardTitle>
//             <CardDescription>
//               Latest medical documentation processed.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//               </div>
//             ) : (
//               <>
//                 <div className="space-y-6">
//                   {stats.recentUploads.map((file, i) => (
//                     <Link
//                       key={file.id}
//                       href={`/dashboard/pdf/${file.id}`}
//                       className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
//                     >
//                       <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
//                         <FileText className="h-5 w-5 text-muted-foreground" />
//                       </div>
//                       <div className="flex-1 space-y-1">
//                         <p className="text-sm font-medium leading-none">
//                           {file.pdf_name}
//                         </p>
//                         <p className="text-xs text-muted-foreground">
//                           {formatFileSize(file.file_size)}
//                         </p>
//                       </div>
//                       <div
//                         className={`text-xs font-medium px-2 py-1 rounded-full ${
//                           file.document_chunks > 0
//                             ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
//                             : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
//                         }`}
//                       >
//                         {file.document_chunks > 0 ? "Embedded" : "Processing"}
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//                 <Button
//                   variant="ghost"
//                   className="w-full mt-6 text-primary"
//                   asChild
//                 >
//                   <Link href="/dashboard/pdf">View All Documents</Link>
//                 </Button>
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Data Source Indicator */}
//       {!loading && !usingRealData && (
//         <Card className="border-amber-500/20 bg-amber-500/5">
//           <CardContent className="pt-6">
//             <p className="text-sm text-muted-foreground text-center">
//               📊 Currently showing demo data. Upload your first PDF to see real
//               statistics.
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
