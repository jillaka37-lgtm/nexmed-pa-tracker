// Deliberately not pulling in a markdown library: the writer agent's system
// prompt constrains it to a narrow subset (H1, H2, plain paragraphs, bold),
// so a tiny hand-rolled renderer covers it without adding a dependency for
// a much larger feature set we don't need.

import type { ReactNode } from "react";

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="mb-4 leading-relaxed text-muted">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-offwhite">{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function MarkdownArticle({ contentMd }: { contentMd: string }) {
  const lines = contentMd.split("\n");
  const blocks: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let key = 0;

  function flushParagraph() {
    const text = paragraphBuffer.join(" ").trim();
    if (text) blocks.push(renderInline(text, key++));
    paragraphBuffer = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push(
        <h1 key={key++} className="mb-4 font-serif text-3xl font-bold text-offwhite">
          {trimmed.slice(2)}
        </h1>,
      );
    } else if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push(
        <h2 key={key++} className="mb-3 mt-8 font-serif text-xl font-bold text-offwhite">
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith("- ")) {
      flushParagraph();
      blocks.push(
        <li key={key++} className="ml-5 list-disc text-muted">
          {trimmed.slice(2)}
        </li>,
      );
    } else {
      paragraphBuffer.push(trimmed);
    }
  }
  flushParagraph();

  return <div>{blocks}</div>;
}
