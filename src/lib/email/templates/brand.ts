import { isCloud } from "@/lib/edition";

/**
 * The pictures in every email shell: the logo at the top and the bottom, and
 * the founders' photo above the signature. They are served from the cloud's
 * bucket, and a self hosted instance is neither run by Nicolas and Maria nor
 * guaranteed a route to that bucket, so it types its own name where the logo
 * goes and ends the body without the founders.
 */

const ASSETS = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The header logo is 238 wide, the footer one 180. Self hosted: the instance name, or the product's. */
export function logoHtml(width: 238 | 180, instanceName?: string): string {
  if (isCloud()) {
    return `<img src="${ASSETS}/logo.png" border="0" alt="LinkedGrow" width="${width}" style="max-width: ${width}px; display: inline-block;">`;
  }
  const size = width === 238 ? 26 : 18;
  const name = escapeHtml(instanceName?.trim() || "LinkedGrow");
  return `<span style="font-family: 'Inter', sans-serif; color: #0182f2; font-size: ${size}px; font-weight: 700; line-height: 1;">${name}</span>`;
}

/** The photo and the signature, the two tables the shell places after the body. */
export function foundersHtml(): string {
  if (!isCloud()) return "";
  return `                                <!-- Photos -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email/photos.png" loading="lazy" border="0" alt="Nicolas & Maria - Founders of LinkedGrow" width="158" height="89" style="display: block; width: 158px; height: 89px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Signature - Nicolas & Maria -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td class="row" style="padding: 0 50px; line-height: 1;" align="left">
                                            <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email/nicolas-maria.png" loading="lazy" border="0" alt="Nicolas & Maria" width="204" height="49" style="display: block; width: 204px; height: 49px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>`;
}
