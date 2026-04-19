/**
 * Password Reset Email Template
 * Sent when users request to reset their password
 */

export function generatePasswordResetEmail(userName: string, resetUrl: string): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Password Reset</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .warning{background:#FEF3C7;border:1px solid #F59E0B;padding:15px;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>🔐 Password Reset Request</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>We received a request to reset your password.</p>
    <a class="button" href="${resetUrl}">Reset Your Password</a>
    <div class="warning"><strong>Security Notice:</strong> This link expires in 1 hour.</div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
}
