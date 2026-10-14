/** Splits a model reply of the form "SUBJECT: ...\n\nbody" into parts. Pure, so it is unit tested. */
export function parseDraft(text: string): { subject: string; body: string } {
  const lines = text.trim().split(/\r?\n/);
  const first = lines[0]?.match(/^\s*subject\s*:\s*(.+)$/i);
  if (first) return { subject: first[1].trim().slice(0, 200), body: lines.slice(1).join("\n").trim() };
  return { subject: "", body: text.trim() };
}

export function footerText(unsubscribeUrl: string, postalAddress: string) {
  return `\n\n--\n${postalAddress}\nDon't want these emails? Unsubscribe: ${unsubscribeUrl}`;
}
