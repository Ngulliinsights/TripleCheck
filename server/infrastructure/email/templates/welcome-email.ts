/**
 * Welcome Email Template
 * Sent to new users when they create an account
 */

export function generateWelcomeEmail(userName: string, loginUrl: string): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>Welcome to TripleCheck Kenya! 🇰🇪</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>Welcome to Kenya's most trusted land verification platform.</p>
    <ul>
      <li>Browse verified properties</li><li>Start land verification</li>
      <li>Connect with verified experts</li><li>Use fraud detection tools</li>
    </ul>
    <a class="button" href="${loginUrl}">Access Your Account</a>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
}
