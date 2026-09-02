import { policyLinksHtml, policyLinksText } from "./policy-links";
import { foundersHtml, logoHtml } from "./brand";
// Network Notification invite email template - transactional email sent via Brevo
interface NetworkNotificationInviteEmailParams {
  /** Typed where the logo goes on a self hosted instance. */
  instanceName?: string;
  inviterName: string;
  groupName: string;
  inviteUrl: string;
}

export function networkNotificationInviteEmailTemplate({ inviterName, groupName, inviteUrl, instanceName }: NetworkNotificationInviteEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if mso]>
    <style>
        * { font-family: sans-serif !important; }
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;}
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        table { border-collapse: collapse; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        h1, h2, h3, h4, h5, p { margin: 0; word-break: break-word; }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        @media all and (max-width: 639px) {
            .wrapper { width: 100% !important; }
            .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
            .row { padding-left: 20px !important; padding-right: 20px !important; }
            .img { width: 100% !important; height: auto !important; }
        }
    </style>
    <title>${inviterName} invited you to a Network Notification group on LinkedGrow</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
    <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
        <!-- Hidden preheader text -->
        <div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            &nbsp;${inviterName} wants you to join their Network Notification group "${groupName}" on LinkedGrow.
        </div>

        <table width="100%" align="center" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td bgcolor="#F4F7FA" align="center" valign="top" style="padding: 0 8px;">

                    <!-- Top spacing -->
                    <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
                        <tr>
                            <td height="20" style="line-height: 20px;"></td>
                        </tr>
                    </table>

                    <!-- Main Content -->
                    <table width="640" class="wrapper" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px; border: 1px solid #EAECED; border-radius: 8px; border-collapse: separate !important; overflow: hidden;">
                        <tr>
                            <td align="center">

                                <!-- Logo -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            ${logoHtml(238, instanceName)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Title -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <h1 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 36px; line-height: 125%; font-weight: bold; margin-bottom: 0;">You've been invited!</h1>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Content -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 10px;"><strong>${inviterName}</strong> wants you to join their Network Notification group "<strong>${groupName}</strong>" on LinkedGrow. When group members publish on LinkedIn, you'll get an email so you can read it on LinkedIn and decide how (or whether) to react.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="10" style="line-height: 10px;"></td>
                                    </tr>
                                </table>

                                <!-- CTA Button - Full Width -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="10" style="line-height: 10px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" align="center" style="padding: 0 50px;">
                                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                                <tr>
                                                    <td align="center" bgcolor="#0182f2" style="border-radius: 8px;">
                                                        <a href="${inviteUrl}" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">Accept Invitation</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
                                    </tr>
                                </table>

                                <!-- Expiry Notice -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin: 0;">
                                                    <strong>This invitation expires in 7 days.</strong><br>
                                                    If you weren't expecting this invite, you can safely ignore this email.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Fallback URL -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #64748B; font-size: 14px; line-height: 150%; margin-top: 0; margin-bottom: 8px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
                                            <p style="font-family: 'Inter', sans-serif; color: #0182f2; font-size: 14px; line-height: 150%; margin-top: 0; margin-bottom: 0; word-break: break-all;">${inviteUrl}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Divider -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Sign off -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 0;">See you soon,</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

${foundersHtml()}

                                <!-- Divider 2 -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;" align="center">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                                                <tr>
                                                    <td style="border-top: 1px solid #EAECED;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        ${logoHtml(180, instanceName)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="20" style="line-height: 20px;"></td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="text-align: center !important;">
                                                        <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 14px; line-height: 150%; margin-bottom: 0;">LinkedGrow - AI-Powered LinkedIn Content Platform<br>78 Avenue des Champs-Elysees, Paris, France</p>
                                                    </td>
                                                </tr>
${policyLinksHtml()}
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="40" style="line-height: 40px;"></td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                    <!-- Bottom spacing -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" width="640" style="max-width: 640px; width: 100%;">
                        <tr>
                            <td height="40" style="line-height: 40px;"></td>
                        </tr>
                    </table>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

export function networkNotificationInviteEmailText({ inviterName, groupName, inviteUrl }: NetworkNotificationInviteEmailParams): string {
  return `You've been invited!

${inviterName} wants you to join their Network Notification group "${groupName}" on LinkedGrow. When group members publish on LinkedIn, you'll get an email so you can read it on LinkedIn and decide how (or whether) to react.

Click the link below to accept the invitation:

${inviteUrl}

This invitation expires in 7 days.

If you weren't expecting this invite, you can safely ignore this email.

See you soon,
Nicolas & Maria
Founders of LinkedGrow

---

LinkedGrow - AI-Powered LinkedIn Content Platform
78 Avenue des Champs-Elysees, Paris, France

${policyLinksText()}
`;
}
