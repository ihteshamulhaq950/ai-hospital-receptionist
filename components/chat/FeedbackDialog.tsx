// components/chat/FeedbackDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface FeedbackOption {
  id: string;
  label: string;
}

const POSITIVE_FEEDBACK_OPTIONS: FeedbackOption[] = [
  { id: "accurate", label: "Accurate and helpful" },
  { id: "clear", label: "Clear explanation" },
  { id: "complete", label: "Complete answer" },
  { id: "relevant", label: "Relevant sources" },
];

const NEGATIVE_FEEDBACK_OPTIONS: FeedbackOption[] = [
  { id: "inaccurate", label: "Inaccurate information" },
  { id: "unclear", label: "Unclear or confusing" },
  { id: "incomplete", label: "Incomplete answer" },
  { id: "irrelevant", label: "Irrelevant response" },
  { id: "slow", label: "Too slow" },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackType: 1 | -1; // 1 for like, -1 for dislike
  onSubmit: (feedbackText: string | null) => Promise<void>;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  feedbackType,
  onSubmit,
}: FeedbackDialogProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackOptions =
    feedbackType === 1 ? POSITIVE_FEEDBACK_OPTIONS : NEGATIVE_FEEDBACK_OPTIONS;
  const title = feedbackType === 1 ? "What did you like?" : "What went wrong?";
  const description =
    feedbackType === 1
      ? "Help us understand what worked well"
      : "Help us improve the response";

  const handleToggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Combine selected options and custom feedback
      const feedbackParts: string[] = [];

      if (selectedOptions.length > 0) {
        const selectedLabels = feedbackOptions
          .filter((opt) => selectedOptions.includes(opt.id))
          .map((opt) => opt.label);
        feedbackParts.push(...selectedLabels);
      }

      if (customFeedback.trim()) {
        feedbackParts.push(customFeedback.trim());
      }

      const finalFeedback =
        feedbackParts.length > 0 ? feedbackParts.join(", ") : null;

      await onSubmit(finalFeedback);

      // Reset form
      setSelectedOptions([]);
      setCustomFeedback("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);

    try {
      await onSubmit(null);
      
      // Reset form
      setSelectedOptions([]);
      setCustomFeedback("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Predefined Options */}
          <div className="space-y-2">
            {feedbackOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={() => handleToggleOption(option.id)}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor={option.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>

          {/* Custom Feedback */}
          <div className="space-y-2">
            <label
              htmlFor="custom-feedback"
              className="text-sm font-medium text-muted-foreground"
            >
              Additional feedback (optional)
            </label>
            <Textarea
              id="custom-feedback"
              placeholder="Tell us more..."
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {customFeedback.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Skip"
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}