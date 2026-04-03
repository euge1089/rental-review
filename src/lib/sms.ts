import twilio from "twilio";

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured.");
  }

  return twilio(sid, token);
}

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D+/g, "");
  // If the user enters a 10-digit US number like 7817385784, assume +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // If they already included country code (e.g. 17817385784 or +17817385784)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  // Fallback: if they passed something already starting with +, keep as-is
  if (raw.trim().startsWith("+")) {
    return raw.trim();
  }
  // Otherwise, just prefix + and let Twilio validate/complain
  return `+${digits}`;
}

export async function startSmsVerification(phoneNumber: string) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) {
    throw new Error("Twilio Verify service SID is not configured.");
  }

  const client = getTwilioClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  return client.verify.v2.services(serviceSid).verifications.create({
    to: normalized,
    channel: "sms",
  });
}

export async function checkSmsVerification(phoneNumber: string, code: string) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) {
    throw new Error("Twilio Verify service SID is not configured.");
  }

  const client = getTwilioClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  return client.verify.v2.services(serviceSid).verificationChecks.create({
    to: normalized,
    code,
  });
}
