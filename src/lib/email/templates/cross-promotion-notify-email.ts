// Cross Promotion notification email template - transactional email sent via Brevo
interface CrossPromotionNotifyEmailParams {
  publisherName: string;
  groupName: string;
  postPreview: string;
  reviewUrl: string;
}

export function crossPromotionNotifyEmailTemplate({ publisherName, groupName, postPreview, reviewUrl }: CrossPromotionNotifyEmailParams): string {
  const truncatedPreview = postPreview.length > 200 ? postPreview.slice(0, 200) + "..." : postPreview;

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
    <title>${publisherName} just published a new post</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
    <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
        <!-- Hidden preheader text -->
        <div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            &nbsp;${publisherName} from your "${groupName}" group just published a LinkedIn post. Review it and engage!
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
                                            <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email/logo.png" border="0" alt="LinkedGrow" width="238" style="max-width: 238px; display: inline-block;">
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
                                            <h1 style="font-family: 'Inter', sans-serif; color: #0F172B; font-size: 36px; line-height: 125%; font-weight: bold; margin-bottom: 0;">New post to promote!</h1>
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
                                            <p style="font-family: 'Inter', sans-serif; color: #45556C; font-size: 16px; line-height: 165%; margin-top: 0; margin-bottom: 10px;"><strong>${publisherName}</strong> from your "<strong>${groupName}</strong>" group just published a LinkedIn post. Review it and choose how you'd like to engage.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="10" style="line-height: 10px;"></td>
                                    </tr>
                                </table>

                                <!-- Post Preview -->
                                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" style="color: #45556C;">
                                    <tr>
                                        <td class="row" style="padding: 0 50px;">
                                            <div style="background-color: #F8FAFC; border-left: 4px solid #0182f2; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                                                <p style="font-family: 'Inter', sans-serif; color: #334155; font-size: 14px; line-height: 165%; margin: 0; font-style: italic;">${truncatedPreview}</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="20" style="line-height: 20px;"></td>
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
                                                    <td align="center" bgcolor="#10B981" style="border-radius: 8px;">
                                                        <a href="${reviewUrl}" target="_blank" style="display: block; padding: 16px 32px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center;">Review & Engage</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td height="30" style="line-height: 30px;"></td>
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
                                            <p style="font-family: 'Inter', sans-serif; color: #10B981; font-size: 14px; line-height: 150%; margin-top: 0; margin-bottom: 0; word-break: break-all;">${reviewUrl}</p>
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

                                <!-- Photos -->
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
                                </table>

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
                                                        <img src="https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/email/logo.png" border="0" alt="LinkedGrow" width="180" style="max-width: 180px; display: inline-block;">
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
                                                <tr>
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
                                                </tr>
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

export function crossPromotionNotifyEmailText({ publisherName, groupName, postPreview, reviewUrl }: CrossPromotionNotifyEmailParams): string {
  const truncatedPreview = postPreview.length > 200 ? postPreview.slice(0, 200) + "..." : postPreview;

  return `New post to promote!

${publisherName} from your "${groupName}" group just published a LinkedIn post. Review it and choose how you'd like to engage.

> ${truncatedPreview}

Click the link below to review and engage:

${reviewUrl}

See you soon,
Nicolas & Maria
Founders of LinkedGrow

---

LinkedGrow - AI-Powered LinkedIn Content Platform
78 Avenue des Champs-Elysees, Paris, France

Privacy Policy: https://linkedgrow.ai/privacy
Cookie Policy: https://linkedgrow.ai/cookies
`;
}
