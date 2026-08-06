// Base email template with LinkedGrow branding
// Uses inline styles for email client compatibility (Gmail, Outlook strip <style> tags)

interface BaseTemplateParams {
  preheader?: string;
  content: string;
}

export function baseEmailTemplate({ preheader, content }: BaseTemplateParams): string {
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
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    img { border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    h1, h2, h3, p { margin: 0; word-break: break-word; }
    @media all and (max-width: 639px) {
      .wrapper { width: 100% !important; }
      .container { width: 100% !important; min-width: 100% !important; padding: 0 !important; }
      .row { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
  <title>LinkedGrow</title>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F4F7FA;">
  <div style="background-color: #F4F7FA; line-height: 100%; font-size: 16px;">
    ${preheader ? `<div style="display: none; font-size: 0px; color: #F4F7FA; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">&nbsp;${preheader}</div>` : ""}

    <table width="100%" align="center" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td bgcolor="#F4F7FA" align="center" valign="top" style="padding: 0 8px;">

          <!-- Top spacing -->
          <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
            <tr><td height="20" style="line-height: 20px;"></td></tr>
          </table>

          <!-- Main Content -->
          <table width="640" class="wrapper" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 640px; border: 1px solid #EAECED; border-radius: 8px; border-collapse: separate !important; overflow: hidden;">
            <tr>
              <td align="center">

                <!-- Logo Header -->
                <!-- The wordmark as the site draws it: Linked in slate, Grow in the
                     brand blue. The site puts a cyan-to-blue gradient on that text and
                     Outlook and Gmail both drop it, so the solid end of the gradient is
                     the faithful fallback rather than white on a coloured bar. -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                  <tr><td height="32" style="line-height: 32px;"></td></tr>
                  <tr>
                    <td align="center" style="padding: 0 40px;">
                      <a href="https://linkedgrow.ai" style="text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 27px; font-weight: 700; letter-spacing: -0.9px;"><span style="color: #0f172a;">Linked</span><span style="color: #2563eb;">Grow</span></a>
                    </td>
                  </tr>
                  <tr><td height="26" style="line-height: 26px;"></td></tr>
                  <tr><td style="padding: 0 40px;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td height="1" bgcolor="#e2e8f0" style="line-height: 1px; font-size: 0;">&nbsp;</td></tr></table></td></tr>
                </table>

                <!-- Body Content -->
                <table width="100%" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0">
                  <tr><td height="32" style="line-height: 32px;"></td></tr>
                  <tr>
                    <td class="row" style="padding: 0 40px; font-family: 'Inter', sans-serif;">
                      ${content}
                    </td>
                  </tr>
                  <tr><td height="32" style="line-height: 32px;"></td></tr>
                </table>

                <!-- Footer -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                  <tr><td height="24" style="line-height: 24px;"></td></tr>
                  <tr>
                    <td align="center" style="padding: 0 40px; font-family: 'Inter', sans-serif;">
                      <p style="margin: 0 0 12px 0; font-size: 14px;">
                        <a href="https://linkedin.com/company/linkedgrow" style="color: #06B6D4; text-decoration: none; font-weight: 600;">LinkedIn</a>
                        <span style="color: #cbd5e1; margin: 0 6px;">|</span>
                        <a href="https://twitter.com/linkedgrow" style="color: #06B6D4; text-decoration: none; font-weight: 600;">X (Twitter)</a>
                      </p>
                      <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
                        <a href="https://linkedgrow.ai/privacy" style="color: #64748b; text-decoration: underline;">Privacy</a> &nbsp;&middot;&nbsp;
                        <a href="https://linkedgrow.ai/cookies" style="color: #64748b; text-decoration: underline;">Cookies</a> &nbsp;&middot;&nbsp;
                        <a href="https://linkedgrow.ai/dashboard/settings" style="color: #64748b; text-decoration: underline;">Email settings</a><br><br>
                        &copy; ${new Date().getFullYear()} LinkedGrow, made with love in Switzerland by
                        <a href="https://nicolaslecocq.com/" style="color: #64748b; text-decoration: underline;">Nicolas Lecocq</a>.
                      </p>
                    </td>
                  </tr>
                  <tr><td height="24" style="line-height: 24px;"></td></tr>
                </table>

              </td>
            </tr>
          </table>

          <!-- Bottom spacing -->
          <table class="container" align="center" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px;">
            <tr><td height="20" style="line-height: 20px;"></td></tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
