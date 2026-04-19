/**
 * Property Inquiry Notification Email Template
 * Sent when a new inquiry is received for a property listing
 */

export function generatePropertyInquiryEmail(
  propertyTitle: string,
  inquirerName: string,
  message: string,
  contactInfo: string
): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>New Property Inquiry</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .inquiry{background:#fff;border:1px solid #ddd;padding:20px;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>📧 New Property Inquiry</h1></div>
  <div class="content">
    <h2>Property: ${propertyTitle}</h2>
    <div class="inquiry">
      <p><strong>From:</strong> ${inquirerName}</p>
      <p><strong>Contact:</strong> ${contactInfo}</p>
      <p><strong>Message:</strong></p>
      <p style="background:#f8f8f8;padding:15px;border-radius:5px">${message}</p>
    </div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
}
