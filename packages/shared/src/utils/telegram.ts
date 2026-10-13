/**
 * Escapes characters for Telegram HTML parse mode.
 * Telegram HTML supports: <b>, <i>, <code>, <s>, <u>, <a>, <pre>.
 * Text content must escape &, <, and >.
 */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

