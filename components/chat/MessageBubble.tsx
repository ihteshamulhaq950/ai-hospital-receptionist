// /components/chat/MessageBubble.tsx
"use client";

import { Bot, User, FileText, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/utils";
import { useState } from "react";
import { FeedbackDialog } from "./FeedbackDialog";

interface ContextSource {
  id: string;
  score: number;
  page?: number;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  suggestions?: string[];
  contextUsed?: ContextSource[];
  onSuggestionClick?: (suggestion: string) => void;
  messageId?: string;
  userFeedback?: number | null;
  onFeedback?: (messageId: string, feedback: 1 | -1, feedbackText: string | null) => void;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  suggestions = [],
  contextUsed = [],
  onSuggestionClick,
  messageId,
  userFeedback,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<1 | -1 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackClick = async (feedback: 1 | -1) => {
    if (!messageId || !onFeedback || isSubmitting) return;

    // Prevent multiple clicks
    if (userFeedback !== null && userFeedback !== undefined) return;

    // Show dialog and store pending feedback
    setPendingFeedback(feedback);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = async (feedbackText: string | null) => {
    if (!messageId || !onFeedback || pendingFeedback === null) return;

    setIsSubmitting(true);
    try {
      await onFeedback(messageId, pendingFeedback, feedbackText);
    } finally {
      setIsSubmitting(false);
      setPendingFeedback(null);
    }
  };

  if (isUser) {
    return (
      <div className="flex items-end gap-3 justify-end animate-in fade-in duration-300 w-full">
        <div className="flex flex-col items-end max-w-[80%] md:max-w-[70%] min-w-0">
          <div className="px-4 py-3 rounded-2xl rounded-br-md bg-blue-600 dark:bg-blue-500 text-white shadow-sm wrap-break-word">
            <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{content}</p>
          </div>
          {timestamp && (
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/50 shadow-sm">
          <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <>
      <div className="flex items-start gap-3 animate-in fade-in duration-300 w-full">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 dark:bg-emerald-500 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col gap-2 max-w-[80%] md:max-w-[70%] min-w-0 flex-1">
          <Card className="px-4 py-3 rounded-2xl rounded-tl-md shadow-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 wrap-break-word">
            <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap wrap-break-word">
              {content}
            </p>

            {suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  Suggested questions:
                </p>
                <ol className="list-decimal list-inside space-y-1.5">
                  {suggestions.map((q: string, i: number) => (
                    <li key={i} className="text-xs wrap-break-word text-slate-700 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => onSuggestionClick?.(q)}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-left inline wrap-break-word"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 italic">
                  AI-generated suggestions may not guarantee exact RAG coverage.
                </p>
              </div>
            )}
          </Card>

          {/* Feedback Buttons */}
          {messageId && onFeedback && (
            <div className="flex items-center gap-2 px-1">
              {userFeedback !== 1 && (
                <button
                  onClick={() => handleFeedbackClick(-1)}
                  disabled={isSubmitting || userFeedback === -1}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    userFeedback === -1
                      ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Dislike response"
                  title="Provide negative feedback"
                >
                  <ThumbsDown
                    className={cn(
                      "w-4 h-4",
                      userFeedback === -1 && "fill-current"
                    )}
                  />
                </button>
              )}

              {userFeedback !== -1 && (
                <button
                  onClick={() => handleFeedbackClick(1)}
                  disabled={isSubmitting || userFeedback === 1}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    userFeedback === 1
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Like response"
                  title="Provide positive feedback"
                >
                  <ThumbsUp
                    className={cn(
                      "w-4 h-4",
                      userFeedback === 1 && "fill-current"
                    )}
                  />
                </button>
              )}
            </div>
          )}

          {timestamp && (
            <span className="text-[10px] text-muted-foreground px-1">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {/* Source References */}
          {contextUsed.length > 0 && (
            <Card className="px-2.5 py-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium mb-1.5">
                <FileText className="w-3 h-3 shrink-0" />
                <span className="text-[10px]">Sources ({contextUsed.length})</span>
              </div>
              <div className="space-y-1.5">
                {contextUsed.map((source: ContextSource, idx: number) => {
                  const scorePercent = source.score * 100;
                  const barColor =
                    scorePercent >= 60
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : scorePercent >= 40
                        ? "bg-amber-500 dark:bg-amber-400"
                        : "bg-rose-500 dark:bg-rose-400";
                  const badgeColor =
                    scorePercent >= 60
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : scorePercent >= 40
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
                  return (
                    <div key={source.id || idx} className="flex items-center gap-2 py-1 min-w-0">
                      <Badge
                        className={cn(
                          "w-4 h-4 rounded-full p-0 flex items-center justify-center text-[9px] font-semibold shrink-0",
                          badgeColor,
                        )}
                      >
                        {idx + 1}
                      </Badge>
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 whitespace-nowrap font-medium shrink-0">
                        {scorePercent.toFixed(0)}%
                        {source.page && ` • p${source.page}`}
                      </span>
                      <div className="flex-1 h-1.5 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden min-w-0">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            barColor,
                          )}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Feedback Dialog */}
      {pendingFeedback !== null && (
        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          feedbackType={pendingFeedback}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
}

// // /components/chat/MessageBubble.tsx
// "use client";

// import { Bot, User, FileText, Sparkles } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils/utils";

// interface ContextSource {
//   id: string;
//   score: number;
//   page?: number;
// }

// interface MessageBubbleProps {
//   role: "user" | "assistant";
//   content: string;
//   timestamp?: Date;
//   suggestions?: string[];
//   contextUsed?: ContextSource[];
//   onSuggestionClick?: (suggestion: string) => void;
// }

// export function MessageBubble({
//   role,
//   content,
//   timestamp,
//   suggestions = [],
//   contextUsed = [],
//   onSuggestionClick,
// }: MessageBubbleProps) {
//   const isUser = role === "user";

//   if (isUser) {
//     return (
//       <div className="flex items-end gap-3 justify-end animate-in fade-in duration-300 w-full">
//         <div className="flex flex-col items-end max-w-[80%] md:max-w-[70%] min-w-0">
//           <div className="px-4 py-3 rounded-2xl rounded-br-md bg-blue-600 dark:bg-blue-500 text-white shadow-sm wrap-break-word">
//             <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{content}</p>
//           </div>
//           {timestamp && (
//             <span className="text-[10px] text-muted-foreground mt-1 px-1">
//               {timestamp.toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </span>
//           )}
//         </div>
//         <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/50 shadow-sm">
//           <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
//         </div>
//       </div>
//     );
//   }

//   // Assistant message
//   return (
//     <div className="flex items-start gap-3 animate-in fade-in duration-300 w-full">
//       <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 dark:bg-emerald-500 shadow-sm">
//         <Bot className="w-4 h-4 text-white" />
//       </div>
//       <div className="flex flex-col gap-2 max-w-[80%] md:max-w-[70%] min-w-0 flex-1">
//         <Card className="px-4 py-3 rounded-2xl rounded-tl-md shadow-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 wrap-break-word">
//           <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap wrap-break-word">
//             {content}
//           </p>

//           {suggestions.length > 0 && (
//             <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
//               <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
//                 <Sparkles className="w-3 h-3 shrink-0" />
//                 Suggested questions:
//               </p>
//               <ol className="list-decimal list-inside space-y-1.5">
//                 {suggestions.map((q: string, i: number) => (
//                   <li key={i} className="text-xs wrap-break-word text-slate-700 dark:text-slate-300">
//                     <button
//                       type="button"
//                       onClick={() => onSuggestionClick?.(q)}
//                       className="text-emerald-600 dark:text-emerald-400 hover:underline text-left inline wrap-break-word"
//                     >
//                       {q}
//                     </button>
//                   </li>
//                 ))}
//               </ol>
//               <p className="text-[10px] text-slate-500 dark:text-slate-500 italic">
//                 AI-generated suggestions may not guarantee exact RAG coverage.
//               </p>
//             </div>
//           )}
//         </Card>

//         {timestamp && (
//           <span className="text-[10px] text-muted-foreground px-1">
//             {timestamp.toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           </span>
//         )}

//         {/* Source References */}
//         {contextUsed.length > 0 && (
//           <Card className="px-2.5 py-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40">
//             <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium mb-1.5">
//               <FileText className="w-3 h-3 shrink-0" />
//               <span className="text-[10px]">Sources ({contextUsed.length})</span>
//             </div>
//             <div className="space-y-1.5">
//               {contextUsed.map((source: ContextSource, idx: number) => {
//                 const scorePercent = source.score * 100;
//                 const barColor =
//                   scorePercent >= 60
//                     ? "bg-emerald-500 dark:bg-emerald-400"
//                     : scorePercent >= 40
//                       ? "bg-amber-500 dark:bg-amber-400"
//                       : "bg-rose-500 dark:bg-rose-400";
//                 const badgeColor =
//                   scorePercent >= 60
//                     ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
//                     : scorePercent >= 40
//                       ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
//                       : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
//                 return (
//                   <div key={source.id || idx} className="flex items-center gap-2 py-1 min-w-0">
//                     <Badge
//                       className={cn(
//                         "w-4 h-4 rounded-full p-0 flex items-center justify-center text-[9px] font-semibold shrink-0",
//                         badgeColor,
//                       )}
//                     >
//                       {idx + 1}
//                     </Badge>
//                     <span className="text-[10px] text-amber-800 dark:text-amber-300 whitespace-nowrap font-medium shrink-0">
//                       {scorePercent.toFixed(0)}%
//                       {source.page && ` • p${source.page}`}
//                     </span>
//                     <div className="flex-1 h-1.5 bg-amber-200 dark:bg-amber-900/40 rounded-full overflow-hidden min-w-0">
//                       <div
//                         className={cn(
//                           "h-full rounded-full transition-all duration-700 ease-out",
//                           barColor,
//                         )}
//                         style={{ width: `${scorePercent}%` }}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }