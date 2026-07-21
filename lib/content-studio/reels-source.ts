/**
 * Prepares raw material for a reels script — plain code, no LLM. Fetching
 * and cleaning HTML requires no judgment, so it's not an agent's job; the
 * model comes in only to decide what's worth a video.
 */

export type ReelsSource = {
  text: string;
  origin: string;
  /**
   * Is this text a real fact, or another agent's output? Human-supplied
   * text/links are citable raw material. When a campaign feeds a
   * strategist-generated angle in as the "source" instead, any numbers or
   * specifics in it were invented by that agent — carrying this flag with
   * the source itself (not as a separate parameter) is what let the same
   * fabrication bug get caught the second time it showed up, in the
   * LinkedIn pipeline first.
   */
  trusted: boolean;
};

/**
 * http/https only, no internal network addresses.
 *
 * This function fetches a user-supplied URL from the server. Without this
 * guard, the server could be made to request internal addresses
 * (localhost, private ranges, cloud metadata endpoints) — an SSRF attack.
 * The studio sits behind admin auth, but that's not a reason to skip a
 * cheap guard on top.
 */
function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That's not a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links are supported.");
  }

  const host = url.hostname.toLowerCase();
  const isPrivate =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (isPrivate) throw new Error("Internal network addresses aren't allowed.");
  return url;
}

/** Strips tags and collapses whitespace — enough for ordinary web articles. */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|h[1-6]|li|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MIN_USEFUL_CHARS = 200;

export async function prepareReelsSource(input: {
  sourceUrl?: string | null;
  sourceText?: string | null;
  /** Defaults true — direct human input. A campaign passes false. */
  trusted?: boolean;
}): Promise<ReelsSource> {
  const trusted = input.trusted ?? true;
  const text = input.sourceText?.trim();
  if (text) {
    if (text.length < 40) throw new Error("That text is too short — give a few more sentences.");
    return { text, origin: trusted ? "user-supplied text" : "campaign-generated angle", trusted };
  }

  const raw = input.sourceUrl?.trim();
  if (!raw) throw new Error("Provide either a link or text.");

  const url = assertSafeUrl(raw);

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NexMedContentStudio/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
  } catch {
    throw new Error("Couldn't read that link (network error or timeout). Paste the text directly instead.");
  }

  if (!res.ok) throw new Error(`Couldn't read that link (HTTP ${res.status}). Paste the text directly instead.`);

  const body = htmlToText(await res.text());

  // JS-rendered or protected pages return effectively no text — fail
  // explicitly rather than have the writer make something up from nothing.
  if (body.length < MIN_USEFUL_CHARS) {
    throw new Error("Couldn't extract usable text from that link (likely a JS-rendered page). Paste the text directly instead.");
  }

  return { text: body.slice(0, 12000), origin: url.href, trusted };
}
