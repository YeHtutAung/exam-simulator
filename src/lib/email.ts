"use server";

import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[email] SMTP not configured — logging instead:");
    console.log(`[email] To: ${to}`);
    console.log(`[email] Subject: ${subject}`);
    console.log(`[email] Body: ${text}`);
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html ?? undefined,
  });
}
