/**
 * The pieces every LinkedGrow email is built from.
 *
 * Written once because thirteen templates already carry their own copy of the
 * same table markup, and the fourteenth would have made the button a different
 * blue somewhere. Everything here goes inside baseEmailTemplate's content slot,
 * which supplies the header, the footer and the width.
 */

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function p(text: string): string {
  return `<p style="font-family: ${FONT}; font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 16px;">${text}</p>`;
}

export function lead(text: string): string {
  return `<p style="font-family: ${FONT}; font-size: 17px; line-height: 1.55; color: #0f172a; font-weight: 600; margin: 0 0 16px;">${text}</p>`;
}

export function small(text: string): string {
  return `<p style="font-family: ${FONT}; font-size: 13px; line-height: 1.6; color: #64748b; margin: 16px 0 0;">${text}</p>`;
}

/** The one action. A second button competing with it halves both. */
export function button(href: string, label: string): string {
  return `<table border="0" cellspacing="0" cellpadding="0" style="margin: 8px 0 20px;">
  <tr>
    <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
      <a href="${href}" target="_blank" style="display: block; padding: 14px 28px; font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">${label}</a>
    </td>
  </tr>
</table>`;
}

/** A quieter second action, for the one place that needs to offer leaving. */
export function textLink(href: string, label: string): string {
  return `<p style="font-family: ${FONT}; font-size: 13px; margin: 0 0 20px;"><a href="${href}" style="color: #64748b; text-decoration: underline;">${label}</a></p>`;
}

/** What somebody said, kept visually theirs rather than reflowed into ours. */
export function quote(text: string): string {
  return `<table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 20px;">
  <tr>
    <td style="border-left: 3px solid #06B6D4; padding: 4px 0 4px 16px;">
      <p style="font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: #0f172a; margin: 0;">${text}</p>
    </td>
  </tr>
</table>`;
}

/** One person in a list: who they are, and why they are worth reading. */
export function personRow(name: string, title: string, why: string, score: number | null): string {
  return `<table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 14px;">
  <tr>
    <td style="padding: 12px 14px; background: #f8fafc; border-radius: 10px;">
      <p style="font-family: ${FONT}; font-size: 14px; font-weight: 600; color: #0f172a; margin: 0;">
        ${name}${score === null ? "" : ` <span style="color: #0182f2; font-weight: 600;">${score}</span>`}
      </p>
      <p style="font-family: ${FONT}; font-size: 13px; color: #64748b; margin: 3px 0 0;">${title}</p>
      <p style="font-family: ${FONT}; font-size: 13px; color: #475569; margin: 6px 0 0;">${why}</p>
    </td>
  </tr>
</table>`;
}

/** Numbers, when there are numbers. Never a zero dressed up as progress. */
export function figures(rows: Array<{ label: string; value: string }>): string {
  return `<table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 20px;">
  ${rows
    .map(
      (r) => `<tr>
    <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-family: ${FONT}; font-size: 14px; color: #64748b;">${r.label}</td>
    <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: #0f172a;">${r.value}</td>
  </tr>`
    )
    .join("")}
</table>`;
}

