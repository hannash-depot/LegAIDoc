/**
 * Shared email layout wrapper with RTL/LTR support.
 */

const RTL_LOCALES = ['he', 'ar'];

export function wrapEmailLayout(content: string, locale: string): string {
  const isRtl = RTL_LOCALES.includes(locale);
  const dir = isRtl ? 'rtl' : 'ltr';
  const align = isRtl ? 'right' : 'left';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: Arial, 'Helvetica Neue', Tahoma, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a56db; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">LegAIDoc</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px; direction: ${dir}; text-align: ${align}; color: #1a1a1a; font-size: 15px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
              &copy; ${new Date().getFullYear()} LegAIDoc. ${isRtl ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
