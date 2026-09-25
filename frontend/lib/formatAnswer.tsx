import type { ReactNode } from "react";

/**
 * Renders **bold** spans from an LLM answer as <strong>. Everything else stays
 * plain text: no HTML is ever interpreted, so untrusted model output can't inject markup.
 */
export function renderInlineBold(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
  );
}
