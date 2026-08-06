/**
 * The blocks every LinkedGrow email body is built from.
 *
 * These are the v1 welcome email's own content blocks, extracted so the eleven
 * new templates draw the same thing rather than inventing it. That matters more
 * than it sounds: the shell is a 640px wrapper whose cells are centred, so a
 * bare paragraph lands centred, unpadded and on the wrong background. Every
 * block below therefore carries its own full-width white table, its own `row`
 * cell at 50px of padding, and its own left alignment.
 *
 * The palette is the welcome email's and is not up for reinvention: #0F172B for
 * headings, #45556C for body text, #EAECED for rules, #0182f2 for the action.
 */

const FONT = "'Inter', sans-serif";
const INK = "#45556C";
const HEADING = "#0F172B";

/** Every block sits in this: white, full width, 50px gutters, left aligned. */
function row(inner: string, topGap = 20): string {
  return `<table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: ${INK};">
    <tr><td height="${topGap}" style="line-height: ${topGap}px;"></td></tr>
    <tr>
        <td class="row" style="padding: 0 50px;" align="left">${inner}</td>
    </tr>
</table>`;
}

export function p(text: string): string {
  return row(
    `<p style="font-family: ${FONT}; color: ${INK}; font-size: 16px; line-height: 165%; margin: 0;">${text}</p>`
  );
}

/** The one sentence the email exists for, sized like the welcome email's h1. */
export function lead(text: string): string {
  return row(
    `<h1 style="font-family: ${FONT}; color: ${HEADING}; font-size: 26px; line-height: 130%; font-weight: bold; margin: 0;">${text}</h1>`
  );
}

export function small(text: string): string {
  return row(
    `<p style="font-family: ${FONT}; color: #7B8794; font-size: 14px; line-height: 155%; margin: 0;">${text}</p>`
  );
}

/** The one action, full width, as the welcome email draws it. */
export function button(href: string, label: string): string {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
                <a href="${href}" target="_blank" style="display: block; padding: 16px 32px; font-family: ${FONT}; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">${label}</a>
            </td>
        </tr>
    </table>`,
    24
  );
}

/** A quieter second action, for the one place that has to offer leaving. */
export function textLink(href: string, label: string): string {
  return row(
    `<p style="font-family: ${FONT}; font-size: 14px; margin: 0;"><a href="${href}" style="color: #7B8794; text-decoration: underline;">${label}</a></p>`,
    12
  );
}

/** What somebody said, kept visually theirs rather than reflowed into ours. */
export function quote(text: string): string {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td style="border-left: 3px solid #0182f2; padding: 2px 0 2px 16px;">
                <p style="font-family: ${FONT}; color: ${HEADING}; font-size: 16px; line-height: 160%; margin: 0;">${text}</p>
            </td>
        </tr>
    </table>`
  );
}

/** One person: who they are, and why they are worth reading. */
export function personRow(name: string, title: string, why: string, score: number | null): string {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #EAECED; border-radius: 8px;">
        <tr>
            <td style="padding: 14px 16px;">
                <p style="font-family: ${FONT}; font-size: 15px; font-weight: bold; color: ${HEADING}; margin: 0;">${name}${score === null ? "" : ` <span style="color: #0182f2;">${score}</span>`}</p>
                <p style="font-family: ${FONT}; font-size: 14px; color: #7B8794; margin: 4px 0 0;">${title}</p>
                <p style="font-family: ${FONT}; font-size: 14px; color: ${INK}; line-height: 155%; margin: 8px 0 0;">${why}</p>
            </td>
        </tr>
    </table>`,
    12
  );
}

/** Numbers, when there are numbers. Never a zero dressed up as progress. */
export function figures(rows: Array<{ label: string; value: string }>): string {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${rows
      .map(
        (r) => `<tr>
        <td style="padding: 9px 0; border-bottom: 1px solid #EAECED; font-family: ${FONT}; font-size: 15px; color: ${INK};">${r.label}</td>
        <td align="right" style="padding: 9px 0; border-bottom: 1px solid #EAECED; font-family: ${FONT}; font-size: 15px; font-weight: bold; color: ${HEADING};">${r.value}</td>
    </tr>`
      )
      .join("")}
</table>`
  );
}
