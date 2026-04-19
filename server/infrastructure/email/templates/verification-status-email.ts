/**
 * Verification Status Update Email Template
 * Sent when the status of a land verification changes
 */

export function generateVerificationStatusEmail(
  userName: string,
  propertyTitle: string,
  status: string,
  details: string
): string {
  const statusColors: Record<string, string> = {
    completed: '#10B981',
    failed: '#EF4444',
    pending: '#F59E0B'
  };
  const statusColor = statusColors[status] ?? '#F59E0B';
  const frontend = process.env.FRONTEND_URL || 'https://triplecheck.co.ke';

  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verification Update</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .status{background:#fff;border-left:4px solid ${statusColor};padding:20px;margin:15px 0;border-radius:0 5px 5px 0}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>🔍 Land Verification Update</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>We have an update on your land verification for:</p>
    <h3>${propertyTitle}</h3>
    <div class="status"><h4>Status: ${status.toUpperCase()}</h4><p>${details}</p></div>
    <a class="button" href="${frontend}/dashboard/verifications">View Full Report</a>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
}
