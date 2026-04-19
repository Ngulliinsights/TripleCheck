/**
 * Production Deployment Certificate Template
 * Generates formal production deployment certificate in HTML format
 */

interface CertificationInfo {
  assessmentId: string;
  certificateId: string;
  overallScore: number;
  startTime: Date;
  validUntil?: Date;
}

/**
 * Generate production deployment certificate HTML
 */
export function generateProductionCertificate(result: CertificationInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Production Deployment Certificate</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f8f9fa; }
        .certificate { background: white; padding: 60px; border: 3px solid #28a745; border-radius: 10px; text-align: center; max-width: 800px; margin: 0 auto; }
        .header { color: #28a745; font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .title { font-size: 28px; color: #333; margin-bottom: 30px; }
        .content { font-size: 18px; line-height: 1.6; color: #555; margin-bottom: 40px; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .signature { margin-top: 60px; }
        .seal { width: 100px; height: 100px; border: 3px solid #28a745; border-radius: 50%; display: inline-block; line-height: 94px; font-weight: bold; color: #28a745; margin: 20px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">🏆 PRODUCTION DEPLOYMENT CERTIFICATE</div>
        
        <div class="title">TripleCheck Database System</div>
        
        <div class="content">
            This is to certify that the TripleCheck Database System has successfully completed
            comprehensive production readiness assessment and meets all requirements for
            production deployment.
        </div>
        
        <div class="details">
            <p><strong>Assessment ID:</strong> ${result.assessmentId}</p>
            <p><strong>Certificate ID:</strong> ${result.certificateId}</p>
            <p><strong>Overall Score:</strong> ${result.overallScore}%</p>
            <p><strong>Assessment Date:</strong> ${result.startTime.toDateString()}</p>
            <p><strong>Valid Until:</strong> ${result.validUntil?.toDateString()}</p>
        </div>
        
        <div class="content">
            The system has been validated for:
            <ul style="text-align: left; display: inline-block;">
                <li>Performance and scalability requirements</li>
                <li>High availability and disaster recovery</li>
                <li>Security and compliance standards</li>
                <li>Monitoring and operational excellence</li>
                <li>Data integrity and reliability</li>
            </ul>
        </div>
        
        <div class="seal">CERTIFIED</div>
        
        <div class="signature">
            <p><strong>TripleCheck Production Readiness Assessment System</strong></p>
            <p>Generated on ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
}
