import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { recordEmailLog } from "./logs";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
}

const CONFIG_FILE = path.join(process.cwd(), "smtp_config.json");
const DEFAULT_CONFIG: SmtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  username: process.env.SMTP_USER || process.env.SMTP_USERNAME || "",
  password: process.env.SMTP_PASSWORD || "",
  fromName: process.env.SMTP_FROM_NAME || "Rudvay Tech Certifications",
  fromEmail: process.env.SMTP_FROM_EMAIL || "info.rudvay@gmail.com",
  useTls: true
};

export function getSmtpConfig(): SmtpConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_CONFIG;
}

export function saveSmtpConfig(config: Partial<SmtpConfig>) {
  const current = getSmtpConfig();
  const updated = { ...current, ...config };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save SMTP config", e);
  }
  return updated;
}

export async function sendCertificateEmail(params: {
  toEmail: string;
  recipientName: string;
  courseName: string;
  certificateId: string;
  pdfBuffer: Uint8Array;
  verificationUrl?: string;
}): Promise<{ success: boolean; message: string; messageId?: string }> {
  const config = getSmtpConfig();
  const verifyUrl = params.verificationUrl || `http://localhost:3000/verify/${params.certificateId}`;

  // If credentials are configured, send real email via nodemailer
  if (config.username && config.password) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.username,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail || config.username}>`,
        to: params.toEmail,
        subject: `Your Certificate of Achievement: ${params.courseName} (${params.certificateId})`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
            <h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 8px;">Rudvay Tech Certifications</h1>
            <p style="font-size: 16px; color: #e2e8f0;">Dear <strong>${params.recipientName}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Congratulations on successfully completing <strong>${params.courseName}</strong>! Your official certificate of achievement has been generated and cryptographically signed.
            </p>
            
            <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8;">Certificate ID:</p>
              <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #38bdf8;">${params.certificateId}</p>
              <a href="${verifyUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Verify Certificate Online
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px;">
              Your official certificate PDF document is attached to this email for your records and portfolio.
            </p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
            <p style="color: #64748b; font-size: 11px;">
              Issued by Rudvay Tech Registry &bull; Verified Zero-Knowledge Credentials
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `Rudvay_Tech_Certificate_${params.certificateId}.pdf`,
            content: Buffer.from(params.pdfBuffer),
            contentType: "application/pdf"
          }
        ]
      });

      recordEmailLog({
        certificateId: params.certificateId,
        recipientEmail: params.toEmail,
        recipientName: params.recipientName,
        courseName: params.courseName,
        status: "SENT",
        senderEmail: config.fromEmail || config.username,
        messageId: info.messageId
      });

      return { success: true, message: "Email sent successfully", messageId: info.messageId };
    } catch (err: any) {
      console.warn("SMTP send encountered an error:", err.message);
      recordEmailLog({
        certificateId: params.certificateId,
        recipientEmail: params.toEmail,
        recipientName: params.recipientName,
        courseName: params.courseName,
        status: "FAILED",
        senderEmail: config.fromEmail || config.username,
        errorMessage: err.message
      });
      return { success: false, message: `SMTP error: ${err.message}` };
    }
  }

  // If no SMTP password configured yet, log dispatch notification
  console.log(`[SMTP Notice] Certificate ${params.certificateId} email prepared for ${params.toEmail} (Configure SMTP in Admin > SMTP Config for direct outbound delivery)`);
  recordEmailLog({
    certificateId: params.certificateId,
    recipientEmail: params.toEmail,
    recipientName: params.recipientName,
    courseName: params.courseName,
    status: "PREPARED",
    senderEmail: config.fromEmail || "info.rudvay@gmail.com",
    errorMessage: "SMTP credentials not provided"
  });
  return { 
    success: true, 
    message: `Certificate prepared. (To deliver live emails directly to inbox, configure SMTP in /admin/smtp)` 
  };
}

export async function testSmtp(config: SmtpConfig, testRecipient: string) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.username,
      pass: config.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.verify();

  if (testRecipient) {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail || config.username}>`,
      to: testRecipient,
      subject: "Rudvay Tech SMTP Handshake Verification",
      text: "SMTP connection handshake and authentication were successful!"
    });
  }

  return { success: true, message: "SMTP connection handshake and test email successful!" };
}
