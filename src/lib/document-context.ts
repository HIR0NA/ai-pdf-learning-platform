export type DocumentContextOptions = {
  query?: string;
  maxChars?: number;
  maxChunks?: number;
};

export type DocumentContext = {
  text: string;
  totalChunks: number;
  selectedChunks: number;
  wasReduced: boolean;
};

const DEFAULT_CHUNK_CHARS = 3200;

function cutAtBoundary(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  const candidate = text.slice(0, maxChars);
  const boundary = Math.max(candidate.lastIndexOf('\n'), candidate.lastIndexOf('。'), candidate.lastIndexOf('. '), candidate.lastIndexOf(' '));
  return candidate.slice(0, boundary > maxChars * 0.55 ? boundary : maxChars).trim();
}

/** Splits extracted PDF text without cutting ordinary paragraphs where possible. */
export function splitDocumentText(text: string, chunkChars = DEFAULT_CHUNK_CHARS) {
  const paragraphs = text.trim().split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > chunkChars) {
      if (current) { chunks.push(current); current = ''; }
      let remaining = paragraph;
      while (remaining.length > chunkChars) {
        const piece = cutAtBoundary(remaining, chunkChars);
        chunks.push(piece);
        remaining = remaining.slice(piece.length).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > chunkChars && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.trim()];
}

function queryTerms(query: string) {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return [...new Set(words)].slice(0, 12);
}

function selectChunkIndexes(chunks: string[], query: string | undefined, count: number) {
  if (chunks.length <= count) return chunks.map((_, index) => index);

  const terms = query ? queryTerms(query) : [];
  if (terms.length) {
    const scored = chunks.map((chunk, index) => ({
      index,
      score: terms.reduce((score, term) => score + (chunk.toLowerCase().includes(term) ? 1 : 0), 0),
    }));
    const relevant = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, count).map((item) => item.index);
    if (relevant.length) return relevant.sort((a, b) => a - b);
  }

  // A summary has no search query, so sample the document from beginning to end.
  return [...new Set(Array.from({ length: count }, (_, index) => Math.round(index * (chunks.length - 1) / Math.max(count - 1, 1))))];
}

/**
 * Builds a bounded, labelled document context. This prevents a long PDF from
 * becoming one oversized provider request while retaining relevant or evenly
 * distributed sections of the source.
 */
export function buildDocumentContext(source: string, options: DocumentContextOptions = {}): DocumentContext {
  const maxChars = options.maxChars ?? 6000;
  const maxChunks = options.maxChunks ?? 3;
  const chunks = splitDocumentText(source);
  const selectedIndexes = selectChunkIndexes(chunks, options.query, maxChunks);
  const excerptBudget = Math.max(120, Math.floor(maxChars / Math.max(selectedIndexes.length, 1)) - 36);
  const selected: string[] = [];

  for (const index of selectedIndexes) {
    const label = `[ส่วนเอกสาร ${index + 1}/${chunks.length}]\n`;
    const excerpt = cutAtBoundary(chunks[index], Math.max(0, excerptBudget - label.length));
    if (!excerpt) continue;
    selected.push(`${label}${excerpt}`);
  }

  const text = selected.join('\n\n');
  return {
    text,
    totalChunks: chunks.length,
    selectedChunks: selected.length,
    wasReduced: source.length > text.length || chunks.length > selected.length,
  };
}

export function limitConversationText(text: string, maxChars = 900) {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…`;
}
