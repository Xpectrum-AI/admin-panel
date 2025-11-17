// Translation utility - calls server-side API to keep API key secure
// The actual Google Translate API key is stored server-side in environment variables

export type LanguageCode = 'am' | 'en';

/**
 * Detect if text is primarily Amharic
 * Uses a simple heuristic: checks if text contains Amharic characters (Unicode range: U+1200-U+137F)
 */
export function detectLanguage(text: string): LanguageCode {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English for empty text
  }

  // Amharic Unicode range: U+1200 to U+137F (includes extended range U+1380-U+139F for some punctuation)
  // Also includes U+2D80-U+2DDF for extended Amharic
  // Count Amharic characters vs total characters
  const amharicMatches = text.match(/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/g);
  const amharicCount = amharicMatches ? amharicMatches.length : 0;
  const totalChars = text.replace(/\s/g, '').length; // Exclude whitespace
  
  // If any Amharic characters are found, consider it Amharic
  // This is more lenient - if there's at least one Amharic character, it's likely Amharic
  if (amharicCount > 0) {
    // Additional check: if more than 20% of characters are Amharic, definitely Amharic
    // Or if there are at least 2 Amharic characters (to avoid false positives from single characters)
    if (amharicCount >= 2 || (totalChars > 0 && (amharicCount / totalChars) > 0.2)) {
      console.log(`[Language Detection] Detected Amharic: ${amharicCount} Amharic chars out of ${totalChars} total chars`);
      return 'am';
    }
  }
  
  console.log(`[Language Detection] Detected English: ${amharicCount} Amharic chars out of ${totalChars} total chars`);
  return 'en';
}

/**
 * Translate text using server-side API (keeps API key secure)
 * @param text - Input text to translate
 * @param targetLang - Target language code ('am' or 'en')
 * @param sourceLang - Optional source language code (if not provided, will auto-detect)
 * @returns Translated text
 */
export async function translate(
  text: string,
  targetLang: LanguageCode,
  sourceLang?: LanguageCode
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    }
    
    throw new Error('No translation found in response');
  } catch (error: any) {
    console.error('Translation error:', error);
    // Return original text on error to avoid breaking the chat flow
    return text;
  }
}

/**
 * Translate text from Amharic to English
 */
export async function translateAmharicToEnglish(text: string): Promise<string> {
  return translate(text, 'en', 'am');
}

/**
 * Translate text from English to Amharic
 */
export async function translateEnglishToAmharic(text: string): Promise<string> {
  return translate(text, 'am', 'en');
}

/**
 * Convert URLs in text to markdown links [text](url)
 * This makes URLs clickable in the rendered markdown
 */
function convertUrlsToMarkdownLinks(text: string): string {
  // URL regex pattern - matches http://, https://, www., and common domain patterns
  const urlRegex = /(https?:\/\/[^\s\)]+|www\.[^\s\)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s\)]*)?)/g;
  
  return text.replace(urlRegex, (url) => {
    // Normalize URL - add https:// if it starts with www.
    let normalizedUrl = url;
    if (url.startsWith('www.')) {
      normalizedUrl = 'https://' + url;
    }
    
    // Create markdown link - use the URL as both text and link
    return `[${url}](${normalizedUrl})`;
  });
}

/**
 * Translate text while preserving formatting (newlines, markdown bold, URLs, etc.)
 * Splits by newlines and translates each line separately, preserving markdown formatting
 * Converts URLs to markdown links to make them clickable
 */
export async function translateEnglishToAmharicWithFormatting(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // First, convert URLs to markdown links before processing
  const textWithLinks = convertUrlsToMarkdownLinks(text);

  // Split by newlines to preserve line breaks
  const lines = textWithLinks.split(/\r?\n/);
  const translatedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      // Preserve empty lines
      translatedLines.push('');
      continue;
    }

    // Check if line contains markdown links [text](url) - preserve these
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const linkMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
    let linkMatch: RegExpExecArray | null;

    // Find all markdown link segments
    while ((linkMatch = linkRegex.exec(line)) !== null) {
      linkMatches.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length,
        text: linkMatch[1], // Text inside []
        url: linkMatch[2],  // URL inside ()
      });
    }

    // Check if line contains markdown bold (**text**)
    const boldRegex = /\*\*([^*]+?)\*\*/g;
    const boldMatches: Array<{ start: number; end: number; text: string }> = [];
    
    // Reset regex lastIndex
    boldRegex.lastIndex = 0;
    let boldMatch: RegExpExecArray | null;
    while ((boldMatch = boldRegex.exec(line)) !== null) {
      // Skip if this bold is inside a link
      const isInsideLink = linkMatches.some(link => 
        boldMatch!.index >= link.start && boldMatch!.index < link.end
      );
      if (!isInsideLink) {
        boldMatches.push({
          start: boldMatch.index,
          end: boldMatch.index + boldMatch[0].length,
          text: boldMatch[1], // Text inside **
        });
      }
    }

    // If no markdown, translate the whole line (but preserve links)
    if (boldMatches.length === 0 && linkMatches.length === 0) {
      const translated = await translate(line, 'am', 'en');
      translatedLines.push(translated);
    } else {
      // Has markdown, process parts separately
      let translatedLine = '';
      let lastIndex = 0;

      // Combine and sort all matches (links and bold) by position
      const allMatches: Array<{ start: number; end: number; type: 'link' | 'bold'; text: string; url?: string }> = [
        ...linkMatches.map(m => ({ ...m, type: 'link' as const })),
        ...boldMatches.map(m => ({ ...m, type: 'bold' as const }))
      ].sort((a, b) => a.start - b.start);

      for (const matchItem of allMatches) {
        // Translate text before this match
        if (matchItem.start > lastIndex) {
          const beforeText = line.substring(lastIndex, matchItem.start);
          if (beforeText.trim()) {
            translatedLine += await translate(beforeText, 'am', 'en');
          } else {
            translatedLine += beforeText; // Preserve whitespace
          }
        }

        if (matchItem.type === 'link') {
          // For links, translate the text but keep the URL unchanged
          const translatedLinkText = await translate(matchItem.text, 'am', 'en');
          translatedLine += `[${translatedLinkText}](${matchItem.url})`;
        } else {
          // For bold, translate the text and wrap it back in **
          const translatedBoldText = await translate(matchItem.text, 'am', 'en');
          translatedLine += `**${translatedBoldText}**`;
        }

        lastIndex = matchItem.end;
      }

      // Translate remaining text after last match
      if (lastIndex < line.length) {
        const afterText = line.substring(lastIndex);
        if (afterText.trim()) {
          translatedLine += await translate(afterText, 'am', 'en');
        } else {
          translatedLine += afterText; // Preserve whitespace
        }
      }

      translatedLines.push(translatedLine);
    }
  }

  // Rejoin with newlines
  return translatedLines.join('\n');
}

