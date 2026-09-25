"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Loader2, MessageCircleQuestion, Play, Send, Sparkles, Trash2, User } from "lucide-react";
import { useAskMeeting } from "@/hooks/useAskMeeting";
import { ApiError } from "@/lib/api-client";
import { renderInlineBold } from "@/lib/formatAnswer";
import { cn, formatTimestamp } from "@/lib/utils";
import type { AskAnswer } from "@/types";

const MAX_QUESTION_LENGTH = 500;

const SUGGESTED_QUESTIONS = [
  "Summarize this meeting",
  "What are the action items?",
  "What deadlines were mentioned?",
  "What was decided?",
];

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; answer?: AskAnswer; isError?: boolean };

interface AskMeetingPanelProps {
  meetingId: number;
  onSeek: (time: number) => void;
}

function AnswerMeta({ answer }: { answer: AskAnswer }) {
  return (
    <div className="mt-2 space-y-1.5">
      {answer.notice && (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {answer.notice}
        </p>
      )}
      <p className="flex items-center gap-1 text-xs text-gray-400">
        {answer.mode === "llm" ? (
          <>
            <Sparkles className="h-3 w-3" aria-hidden="true" /> AI answer{answer.model ? ` · ${answer.model}` : ""}
          </>
        ) : (
          "Keyword search over the transcript"
        )}
      </p>
    </div>
  );
}

export function AskMeetingPanel({ meetingId, onSeek }: AskMeetingPanelProps) {
  const ask = useAskMeeting(meetingId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const nextIdRef = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, ask.isPending]);

  async function submitQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || ask.isPending) return;

    setMessages((prev) => [...prev, { id: nextIdRef.current++, role: "user", text: question }]);
    setInput("");

    try {
      const answer = await ask.mutateAsync(question);
      setMessages((prev) => [
        ...prev,
        { id: nextIdRef.current++, role: "assistant", text: answer.answer, answer },
      ]);
    } catch (error) {
      const text =
        error instanceof ApiError && error.status === 422
          ? "That question couldn't be processed. Try rephrasing it."
          : "Couldn't get an answer right now. Please try again.";
      setMessages((prev) => [...prev, { id: nextIdRef.current++, role: "assistant", text, isError: true }]);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Ask about this meeting</h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-ring dark:hover:bg-gray-800"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask a question and get an answer based on this meeting&apos;s transcript, with links to the moments it
              came from.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void submitQuestion(question)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-ring dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-2.5", message.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
              )}
              aria-hidden="true"
            >
              {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : message.role === "assistant" && message.isError
                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
              )}
            >
              <p className="whitespace-pre-line break-words leading-relaxed">
                {message.role === "assistant" ? renderInlineBold(message.text) : message.text}
              </p>

              {message.role === "assistant" && message.answer && (
                <>
                  {message.answer.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.answer.sources.map((source) => (
                        <button
                          key={source.segment_id}
                          type="button"
                          onClick={() => onSeek(source.start_time)}
                          title={source.text}
                          aria-label={`Jump to ${formatTimestamp(source.start_time)}, ${source.speaker_name}`}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:border-brand-400 hover:text-brand-700 focus-ring dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                        >
                          <Play className="h-2.5 w-2.5" aria-hidden="true" />
                          <span className="font-mono">{formatTimestamp(source.start_time)}</span>
                          <span className="max-w-[9rem] truncate">{source.speaker_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <AnswerMeta answer={message.answer} />
                </>
              )}
            </div>
          </div>
        ))}

        {ask.isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask a question about this meeting…"
          aria-label="Ask a question about this meeting"
          className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus-ring focus:border-brand-400 focus:bg-white dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={!input.trim() || ask.isPending}
          aria-label="Send question"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 focus-ring disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
