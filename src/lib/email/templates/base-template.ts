// Base email template with LinkedGrow branding
// Brand colors: Cyan (#06B6D4), Blue (#2563EB), Slate grays

interface BaseTemplateParams {
  preheader?: string;
  content: string;
}

export function baseEmailTemplate({ preheader, content }: BaseTemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <title>LinkedGrow</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
    }

    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }

    .email-wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }

    .email-header {
      background: linear-gradient(135deg, #06B6D4 0%, #2563EB 100%);
      padding: 32px 40px;
      text-align: center;
    }

    .logo {
      display: inline-block;
    }

    .logo-text {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: -0.5px;
    }

    .email-body {
      padding: 40px;
    }

    .email-footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
    }

    .footer-text a {
      color: #06B6D4;
      text-decoration: none;
    }

    .footer-text a:hover {
      text-decoration: underline;
    }

    .social-links {
      margin-bottom: 16px;
    }

    .social-link {
      display: inline-block;
      margin: 0 8px;
    }

    h1 {
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    h2 {
      color: #0f172a;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    p {
      color: #475569;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .button {
      display: inline-block;
      background: linear-gradient(135deg, #06B6D4 0%, #2563EB 100%);
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      margin: 8px 0;
      text-align: center;
    }

    .button:hover {
      opacity: 0.9;
    }

    .button-secondary {
      background: #f1f5f9;
      color: #0f172a !important;
      border: 1px solid #e2e8f0;
    }

    .info-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }

    .info-box-highlight {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .label {
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .value {
      color: #0f172a;
      font-size: 16px;
      font-weight: 500;
    }

    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    .text-center { text-align: center; }
    .text-small { font-size: 14px; }
    .text-muted { color: #64748b; }
    .mt-4 { margin-top: 16px; }
    .mb-4 { margin-bottom: 16px; }

    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 20px 16px; }
      .email-header { padding: 24px 20px; }
      .email-body { padding: 24px 20px; }
      .email-footer { padding: 20px; }
      h1 { font-size: 22px; }
      .button { display: block; width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}${"&nbsp;".repeat(100)}</div>` : ""}

  <div class="email-wrapper">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <div class="email-container">
            <!-- Header -->
            <div class="email-header">
              <a href="https://linkedgrow.ai" class="logo">
                <span class="logo-text">LinkedGrow</span>
              </a>
            </div>

            <!-- Body -->
            <div class="email-body">
              ${content}
            </div>

            <!-- Footer -->
            <div class="email-footer">
              <div class="social-links">
                <a href="https://linkedin.com/company/linkedgrow" class="social-link">
                  <img src="https://linkedgrow.ai/email/linkedin-icon.png" alt="LinkedIn" width="24" height="24" style="display: inline-block;">
                </a>
                <a href="https://twitter.com/linkedgrow" class="social-link">
                  <img src="https://linkedgrow.ai/email/x-icon.png" alt="X" width="24" height="24" style="display: inline-block;">
                </a>
              </div>
              <p class="footer-text">
                LinkedGrow - AI-Powered LinkedIn Content Platform<br>
                A product of Vayalis, Paris, France<br><br>
                <a href="https://linkedgrow.ai/privacy">Privacy Policy</a> |
                <a href="https://linkedgrow.ai/cookies">Cookie Policy</a><br><br>
                &copy; ${new Date().getFullYear()} LinkedGrow. All rights reserved.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
