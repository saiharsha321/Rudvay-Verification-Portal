import nodemailer from "nodemailer";
import { db } from "../firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { recordEmailLog } from "./logs";
import { getAppBaseUrl, sanitizeVerificationUrl } from "../utils/url";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
}

const DEFAULT_CONFIG: SmtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  username: process.env.SMTP_USER || process.env.SMTP_USERNAME || "info.rudvay@gmail.com",
  password: process.env.SMTP_PASSWORD || "wyfiasiteiitlvhm",
  fromName: process.env.SMTP_FROM_NAME || "Rudvay Tech Certifications",
  fromEmail: process.env.SMTP_FROM_EMAIL || "info.rudvay@gmail.com",
  useTls: true
};

export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    if (db) {
      const snap = await getDoc(doc(db, "systemSettings", "smtp"));
      if (snap.exists()) {
        return { ...DEFAULT_CONFIG, ...snap.data() };
      }
    }
  } catch (e) {
    console.warn("Firestore getSmtpConfig notice:", e);
  }
  return DEFAULT_CONFIG;
}

export async function saveSmtpConfig(config: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const current = await getSmtpConfig();
  const updated = { ...current, ...config };
  try {
    if (db) {
      await setDoc(doc(db, "systemSettings", "smtp"), updated, { merge: true });
    }
  } catch (e) {
    console.error("Failed to save SMTP config to Firestore:", e);
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
  const config = await getSmtpConfig();
  const verifyUrl = sanitizeVerificationUrl(params.verificationUrl, params.certificateId);

  const cleanUser = config.username ? config.username.trim() : "";
  const cleanPass = config.password ? config.password.replace(/\s+/g, "") : "";

  // If credentials are configured, send real email via nodemailer
  if (cleanUser && cleanPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host || "smtp.gmail.com",
        port: config.port || 587,
        secure: config.port === 465,
        auth: {
          user: cleanUser,
          pass: cleanPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail || cleanUser}>`,
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

      await recordEmailLog({
        certificateId: params.certificateId,
        recipientEmail: params.toEmail,
        recipientName: params.recipientName,
        courseName: params.courseName,
        status: "SENT",
        senderEmail: config.fromEmail || cleanUser,
        messageId: info.messageId
      });

      return { success: true, message: "Email sent successfully", messageId: info.messageId };
    } catch (err: any) {
      console.warn("SMTP send encountered an error:", err.message);
      await recordEmailLog({
        certificateId: params.certificateId,
        recipientEmail: params.toEmail,
        recipientName: params.recipientName,
        courseName: params.courseName,
        status: "FAILED",
        senderEmail: config.fromEmail || cleanUser,
        errorMessage: err.message
      });
      return { success: false, message: `SMTP error: ${err.message}` };
    }
  }

  // If no SMTP password configured yet, log dispatch notification
  console.log(`[SMTP Notice] Certificate ${params.certificateId} email prepared for ${params.toEmail}`);
  await recordEmailLog({
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
  const cleanUser = config.username ? config.username.trim() : "";
  const cleanPass = config.password ? config.password.replace(/\s+/g, "") : "";

  const transporter = nodemailer.createTransport({
    host: config.host || "smtp.gmail.com",
    port: config.port || 587,
    secure: config.port === 465,
    auth: {
      user: cleanUser,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.verify();

  if (testRecipient) {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail || cleanUser}>`,
      to: testRecipient,
      subject: "Rudvay Tech SMTP Handshake Verification",
      text: "SMTP connection handshake and authentication were successful!"
    });
  }

  return { success: true, message: "SMTP connection handshake and test email successful!" };
}
