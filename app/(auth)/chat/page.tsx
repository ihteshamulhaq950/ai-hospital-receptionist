"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";
import { Bot, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Message } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

// Comprehensive FAQ Database - 24 Questions
const FAQ_DATABASE = [
  {
    question: "What services does Care Link offer?",
    answer: "Care Link Hospital offers comprehensive healthcare services including Emergency Care (24/7), Cardiology, Orthopedics, Pediatrics, Maternity Care, Diagnostic Imaging (X-Ray, MRI, CT Scan), Laboratory Services, Outpatient Clinics, and Surgical Services. We also provide specialized treatments in Oncology, Neurology, and Physical Therapy. Our state-of-the-art facilities ensure you receive the best possible care.",
    category: "services",
    emoji: "🏥"
  },
  {
    question: "How do I schedule an appointment?",
    answer: "You can schedule an appointment in multiple ways: Call our appointment line at (555) 123-4567 (Monday-Friday, 8 AM - 6 PM), book online through our patient portal at Care Link.com/appointments, use our mobile app available on iOS and Android, or visit our reception desk in person. For urgent care, walk-ins are welcome. Please have your insurance information ready when booking.",
    category: "appointments",
    emoji: "📅"
  },
  {
    question: "What are your visiting hours?",
    answer: "General visiting hours are 10:00 AM - 8:00 PM daily. ICU visiting hours are 2:00 PM - 4:00 PM and 6:00 PM - 8:00 PM. Maternity ward allows 24/7 access for one support person. Pediatric ward permits parents to stay overnight. We limit visitors to 2 per patient at a time. Please check with your nurse for any ward-specific restrictions. Service animals are always welcome.",
    category: "visiting",
    emoji: "🕐"
  },
  {
    question: "Do you accept my insurance?",
    answer: "Care Link Hospital accepts most major insurance plans including Blue Cross Blue Shield, Aetna, UnitedHealthcare, Cigna, Medicare, and Medicaid. We're also in-network with many local and regional insurers. Please contact our billing department at (555) 123-4568 or check our website for a complete list of accepted insurance providers. We recommend verifying your coverage before your visit to understand any out-of-pocket costs.",
    category: "billing",
    emoji: "💳"
  },
  {
    question: "Where can I park?",
    answer: "We offer convenient parking options: a 5-level parking garage adjacent to the main entrance with 800+ spaces, valet service available Monday-Friday 7 AM - 7 PM ($8), visitor parking is $3/hour or $15 daily maximum, and emergency patients receive 2 hours free parking with validation. Accessible parking is available on every level near elevators.",
    category: "facilities",
    emoji: "🅿️"
  },
  {
    question: "Do you have emergency services?",
    answer: "Yes! Our Emergency Department operates 24/7/365 with board-certified emergency physicians and trauma specialists. We're a Level II Trauma Center equipped to handle critical emergencies. Average wait time is 15-30 minutes for non-critical cases. For life-threatening emergencies, call 911. We also offer Fast Track services for minor injuries and illnesses.",
    category: "emergency",
    emoji: "🚑"
  },
  {
    question: "Can I get my medical records?",
    answer: "You can access your medical records through our secure patient portal at Care Link.com/portal, request copies by calling Medical Records at (555) 123-4570, or visit the Medical Records office on the 1st floor (Monday-Friday, 8 AM - 5 PM). Most records are available within 3-5 business days. There may be a small fee for printed copies. You'll need photo ID and to complete a release form.",
    category: "records",
    emoji: "📋"
  },
  {
    question: "What are your pharmacy hours?",
    answer: "Our main pharmacy is open Monday-Friday 7 AM - 9 PM, Saturday 9 AM - 7 PM, and Sunday 10 AM - 6 PM. We also have a 24-hour emergency pharmacy for inpatients. You can transfer prescriptions from other pharmacies, and we offer free delivery within 10 miles for seniors and mobility-impaired patients. Call (555) 123-4571 for refills.",
    category: "pharmacy",
    emoji: "💊"
  },
  {
    question: "Do you offer telehealth appointments?",
    answer: "Yes! We offer virtual visits through video, phone, or secure messaging for many conditions including follow-ups, minor illnesses, prescription refills, and specialist consultations. Download our mobile app or visit our patient portal to schedule. Telehealth is covered by most insurance plans. Technical support is available if you need help connecting.",
    category: "telehealth",
    emoji: "💻"
  },
  {
    question: "What COVID-19 precautions are in place?",
    answer: "We maintain strict infection control protocols including enhanced cleaning, HEPA filtration systems, social distancing in waiting areas, and mandatory hand hygiene. Masks are available upon request. We screen all visitors and offer COVID-19 testing and vaccinations. Separate isolation units protect immunocompromised patients. Check our website for current visitor policies.",
    category: "safety",
    emoji: "😷"
  },
  {
    question: "Do you have a cafeteria or food options?",
    answer: "Yes! Our main cafeteria on the ground floor is open 6 AM - 8 PM daily, offering hot meals, salads, sandwiches, and beverages. We also have coffee kiosks on floors 2 and 4, vending machines throughout the hospital, and a Starbucks near the main entrance (6 AM - 6 PM). Special diet meals can be arranged for patients with dietary restrictions.",
    category: "amenities",
    emoji: "🍽️"
  },
  {
    question: "Is there WiFi available?",
    answer: "Free WiFi is available throughout the hospital. Connect to 'Care Link-Guest' network - no password required. We also have charging stations in waiting areas and patient rooms. For assistance, contact our help desk at extension 4500. Business centers with computers and printers are available on floors 1 and 3.",
    category: "amenities",
    emoji: "📶"
  },
  {
    question: "How do I pay my bill?",
    answer: "You can pay bills online through our patient portal, by phone at (555) 123-4568, by mail, or in person at our billing office (1st floor, Monday-Friday 8 AM - 5 PM). We accept all major credit cards, checks, and cash. Payment plans are available - speak with our financial counselors. Online payments post immediately.",
    category: "billing",
    emoji: "💰"
  },
  {
    question: "Do you offer financial assistance?",
    answer: "Yes, we offer financial assistance programs for qualifying patients. Our financial counselors can help with payment plans, charity care applications, and connecting you with community resources. Applications are available at the billing office or online. We work with families to ensure cost doesn't prevent necessary care. Call (555) 123-4569 for confidential assistance.",
    category: "billing",
    emoji: "🤝"
  },
  {
    question: "Can I choose my own doctor?",
    answer: "Absolutely! You can select from our network of over 300 physicians across 40+ specialties. View doctor profiles, credentials, patient reviews, and availability on our website at Care Link.com/find-a-doctor. You can also request a specific physician when scheduling. If you have a preference, let our appointment team know and we'll do our best to accommodate.",
    category: "doctors",
    emoji: "👨‍⚕️"
  },
  {
    question: "Do you have translation services?",
    answer: "Yes! We provide free professional interpretation services in over 30 languages, including American Sign Language. Video and phone interpretation are available 24/7. Request an interpreter when scheduling your appointment or upon arrival. We also have multilingual staff and translated materials for common procedures. Language barriers should never prevent quality care.",
    category: "services",
    emoji: "🌐"
  },
  {
    question: "What should I bring to my appointment?",
    answer: "Please bring: photo ID, insurance card(s), list of current medications, list of allergies, previous medical records if from another provider, and any relevant test results. Arrive 15 minutes early to complete paperwork. For surgical procedures, follow pre-op instructions provided. Don't hesitate to bring a family member or friend for support.",
    category: "appointments",
    emoji: "🎒"
  },
  {
    question: "Do you offer maternity tours?",
    answer: "Yes! We offer complimentary maternity ward tours every Saturday at 10 AM and 2 PM. See our private labor and delivery suites, postpartum rooms, and Level III NICU. Register online or call (555) 123-4572. Virtual tours are also available on our website. We also host prenatal classes covering childbirth, breastfeeding, newborn care, and CPR.",
    category: "maternity",
    emoji: "👶"
  },
  {
    question: "What pediatric services do you provide?",
    answer: "Our pediatric department offers well-child visits, vaccinations, sick visits, and specialized care for chronic conditions. We have pediatric specialists in cardiology, endocrinology, pulmonology, and more. Child-friendly exam rooms, play areas, and pediatric emergency services ensure comfort. Our child life specialists help reduce anxiety. Call (555) 123-4573 for pediatric appointments.",
    category: "pediatrics",
    emoji: "🧒"
  },
  {
    question: "Do you have rehabilitation services?",
    answer: "Yes! Our rehabilitation center offers physical therapy, occupational therapy, speech therapy, and cardiac rehabilitation. We treat sports injuries, post-surgical recovery, stroke rehabilitation, and chronic pain. State-of-the-art equipment and certified therapists create personalized treatment plans. Most insurance plans cover therapy with a referral. Call (555) 123-4574 to schedule an evaluation.",
    category: "services",
    emoji: "🏋️"
  },
  {
    question: "How do I file a complaint or give feedback?",
    answer: "We value your feedback! You can submit comments through our patient portal, speak with our Patient Relations department at (555) 123-4575, complete comment cards available at nurse stations, or email feedback@Care Link.com. For urgent concerns, ask to speak with a nursing supervisor or hospital administrator. We respond to all feedback within 2 business days.",
    category: "feedback",
    emoji: "📝"
  },
  {
    question: "Do you offer health screening events?",
    answer: "Yes! We host free community health screenings monthly, including blood pressure checks, glucose testing, cholesterol screening, and skin cancer screening. Follow us on social media or check Care Link.com/events for upcoming dates. We also offer corporate wellness programs and health fairs. Our preventive care helps catch issues early when they're most treatable.",
    category: "wellness",
    emoji: "🩺"
  },
  {
    question: "Is there a gift shop?",
    answer: "Yes! Our gift shop on the ground floor near the main entrance is open Monday-Friday 9 AM - 6 PM, weekends 10 AM - 4 PM. We offer flowers, balloons, cards, magazines, snacks, and personal care items. Profits support hospital programs and patient care initiatives. You can also order gifts online for delivery to patient rooms.",
    category: "amenities",
    emoji: "🎁"
  },
  {
    question: "What lab tests do you offer?",
    answer: "Our full-service laboratory offers comprehensive testing including blood work, urinalysis, cultures, molecular testing, pathology, and specialized diagnostics. Most routine tests have same-day results. We're open Monday-Friday 6 AM - 6 PM, Saturday 7 AM - 3 PM. No appointment needed for lab work - bring your physician's order. Fasting instructions will be provided when needed.",
    category: "diagnostics",
    emoji: "🔬"
  }
];

// Robust randomization algorithm - Fisher-Yates shuffle
const getRandomFAQs = (allFAQs: typeof FAQ_DATABASE, count: number, exclude: string[] = []) => {
  const available = allFAQs.filter(faq => !exclude.includes(faq.question));
  const shuffled = [...available];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export default function EmptyChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { setIsAssistantTyping } = useChat();

  // Memoized random FAQ selection - regenerates when refreshKey changes
  const displayedFAQs = useMemo(() => {
    const askedQuestions = messages.filter(m => m.role === "user").map(m => m.content);
    const count = Math.floor(Math.random() * 3) + 5; // Random 5-7 questions
    return getRandomFAQs(FAQ_DATABASE, count, askedQuestions);
  }, [refreshKey, messages]);

  const handleFAQClick = (faq: typeof FAQ_DATABASE[0]) => {
    setMessages((prev) => [...prev, { role: "user", content: faq.question }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: faq.answer }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 600); // Randomized typing delay 1.2-1.8s
  };

  const handleRefreshFAQs = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const content = input.trim();

    // Fuzzy matching for FAQ questions (case-insensitive, partial match)
    const matchedFAQ = FAQ_DATABASE.find(
      (faq) => 
        faq.question.toLowerCase() === content.toLowerCase() ||
        (content.length > 10 && faq.question.toLowerCase().includes(content.toLowerCase()))
    );

    if (matchedFAQ) {
      handleFAQClick(matchedFAQ);
      setInput("");
      return;
    }

    // For non-FAQ questions, redirect to chat detail page
    const optimisticUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: "temp",
      role: "user",
      content_text: content,
      content_json: [],
      created_at: new Date().toISOString(),
    };

    setInput("");
    setIsLoading(true);
    setIsAssistantTyping(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content }),
      });

      const data = await res.json();

      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Failed to start chat");
      }

      sessionStorage.setItem(
        `pending_msg_${data.sessionId}`,
        JSON.stringify(optimisticUserMessage),
      );

      window.dispatchEvent(new Event("chatCreated"));
      router.replace(`/chat/${data.sessionId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      setError("Network error. Please try again.");
      setIsAssistantTyping(false);
      setIsLoading(false);
    }
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black">
      <ChatHeader showNewChatButton={false} showCloseButton />

      <ChatContainer dependencies={[messages, isTyping]}>
        {showWelcome ? (
          <>
            {/* Welcome Section */}
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1.5 text-slate-900 dark:text-white">
                  Welcome to Care Link AI
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                  Your 24/7 healthcare assistant. Ask about services, appointments, billing, or any health-related questions.
                </p>
              </div>
            </div>

            {/* Compact Pill-Style FAQ Cards */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick questions — tap for instant answers
                </p>
                <button
                  onClick={handleRefreshFAQs}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  title="Show different questions"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {displayedFAQs.map((faq, i) => (
                  <button
                    key={`${faq.question}-${i}`}
                    onClick={() => handleFAQClick(faq)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 hover:shadow-sm"
                  >
                    <span className="text-sm">{faq.emoji}</span>
                    <span>{faq.question}</span>
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 text-center">
                {FAQ_DATABASE.length} topics available • Showing {displayedFAQs.length} random suggestions
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Conversation Messages */}
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                role={msg.role}
                content={msg.content}
              />
            ))}

            {isTyping && <TypingIndicator />}

            {/* Compact Follow-up Questions */}
            {messages.length > 0 && !isTyping && displayedFAQs.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Related questions
                  </p>
                  <button
                    onClick={handleRefreshFAQs}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {displayedFAQs.slice(0, 5).map((faq, i) => (
                    <button
                      key={`follow-${faq.question}-${i}`}
                      onClick={() => handleFAQClick(faq)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                    >
                      <span className="text-xs">{faq.emoji}</span>
                      <span>{faq.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <Card className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </Card>
        )}
      </ChatContainer>

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSendMessage}
        disabled={isLoading || isTyping}
        isLoading={isLoading}
      />
    </div>
  );
}

