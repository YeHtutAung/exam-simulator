"use server";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  // Dev/stub implementation. Wire to real email provider later.
  console.log(`[email] To: ${to}`);
  console.log(`[email] Subject: ${subject}`);
  console.log(`[email] Body: ${text}`);
}

export function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
