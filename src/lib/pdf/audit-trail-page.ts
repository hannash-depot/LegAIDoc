/**
 * ESIG-06: Generates an immutable audit trail page to append to signed PDFs.
 * Records IP, timestamp, user-agent, and email verification per signer.
 */

interface AuditSignatory {
  name: string;
  email: string;
  role: string;
  verifiedAt: Date | null;
  signedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
  signatureImage: string | null;
}

interface AuditTrailData {
  documentId: string;
  documentTitle: string;
  documentHash: string;
  signatories: AuditSignatory[];
  signedAt: Date;
}

export function generateAuditTrailHtml(data: AuditTrailData): string {
  const signatoryRows = data.signatories
    .map(
      (s) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${escapeHtml(s.name)}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">${escapeHtml(s.email)}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">
          ${s.role === 'INITIATOR' ? 'Initiator / יוזם / المبادر' : 'Counter-Party / צד שני / الطرف المقابل'}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">
          ${s.verifiedAt ? formatDate(s.verifiedAt) : '—'}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">
          ${s.signedAt ? formatDate(s.signedAt) : '—'}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-family: monospace; word-break: break-all;">
          ${escapeHtml(s.ip || '—')}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(truncate(s.userAgent || '—', 80))}
        </td>
      </tr>
      ${
        s.signatureImage
          ? `<tr>
              <td colspan="6" style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 12px; color: #6b7280;">Signature / חתימה / التوقيع:</span>
                  <img src="${s.signatureImage}" alt="Signature" style="max-height: 60px; max-width: 200px; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff;" />
                </div>
              </td>
            </tr>`
          : ''
      }`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, 'Helvetica Neue', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; font-size: 14px; }
    .header { border-bottom: 3px solid #1a56db; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 20px; color: #1a56db; }
    .header p { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; font-size: 13px; }
    .meta-item { background: #f9fafb; padding: 8px 12px; border-radius: 4px; }
    .meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 4px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: start; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    .hash { font-family: monospace; font-size: 11px; word-break: break-all; background: #f9fafb; padding: 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Certificate of Completion — Audit Trail</h1>
    <p>אישור חתימה — נתיב ביקורת &nbsp;|&nbsp; شهادة إتمام — سجل المراجعة</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Document ID / מזהה מסמך</div>
      <div style="font-family: monospace;">${escapeHtml(data.documentId)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Document Title / כותרת</div>
      <div>${escapeHtml(data.documentTitle)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Completed / הושלם</div>
      <div>${formatDate(data.signedAt)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Total Signatories / חותמים</div>
      <div>${data.signatories.length}</div>
    </div>
  </div>

  <div class="hash">
    <span class="meta-label">Document SHA-256 Hash / גיבוב מסמך:</span><br>
    ${escapeHtml(data.documentHash)}
  </div>

  <h3 style="margin-top: 24px; font-size: 15px;">Signatory Details / פרטי חותמים / تفاصيل الموقعين</h3>
  <table>
    <thead>
      <tr>
        <th>Name / שם</th>
        <th>Role / תפקיד</th>
        <th>Verified / אומת</th>
        <th>Signed / חתם</th>
        <th>IP</th>
        <th>User-Agent</th>
      </tr>
    </thead>
    <tbody>
      ${signatoryRows}
    </tbody>
  </table>

  <div class="footer">
    <p>This audit trail is automatically generated and appended to the signed document.</p>
    <p>נתיב ביקורת זה נוצר אוטומטית וצורף למסמך החתום. &nbsp;|&nbsp; تم إنشاء سجل المراجعة هذا تلقائيًا وإرفاقه بالمستند الموقع.</p>
    <p>Generated by LegAIDoc — ${formatDate(new Date())}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jerusalem',
    hour12: false,
  }).format(date);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
