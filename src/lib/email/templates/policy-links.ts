import { isCloud } from "@/lib/edition";

/**
 * The privacy and cookie policy links in every email footer.
 *
 * Those pages exist on the cloud only. A self hosted instance has no policy
 * page to link to, so its footers end at the address line.
 */
export function policyLinksHtml(): string {
  if (!isCloud()) return "";
  return `                                                <tr>
                                                    <td height="16" style="line-height: 16px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">
                                                            <a href="https://linkedgrow.ai/privacy" style="color: #45556C; text-decoration: underline;">Privacy Policy</a>
                                                            <span style="color: #45556C;"> | </span>
                                                            <a href="https://linkedgrow.ai/cookies" style="color: #45556C; text-decoration: underline;">Cookie Policy</a>
                                                        </p>
                                                    </td>
                                                </tr>`;
}

export function policyLinksText(): string {
  if (!isCloud()) return "";
  return `Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies`;
}
