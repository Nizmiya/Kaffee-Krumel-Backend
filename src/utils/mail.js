import axios from "axios";

const RESEND_API_URL = "https://api.resend.com/emails";

function client() {
  return axios.create({
    baseURL: RESEND_API_URL,
    timeout: Number(process.env.MAIL_TIMEOUT || 30000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
  });
}

/**
 * Sends a transactional email via Resend. No-ops (logs only) when
 * MAIL_ENABLED is not "true", so local dev doesn't need real credentials.
 */
export async function sendMail({ to, subject, htmlContent }) {
  if (process.env.MAIL_ENABLED !== "true") {
    console.log(`[mail] disabled — would send "${subject}" to ${to}`);
    return;
  }

  await client().post("", {
    from: `${process.env.MAIL_FROM_NAME || "Kaffee Krümel"} <${process.env.MAIL_FROM_EMAIL}>`,
    to: [to],
    subject,
    html: htmlContent,
    reply_to: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM_EMAIL,
  });
}

export async function sendOtpMail(to, code, purpose) {
  const subjectByPurpose = {
    register: "Verify your Kaffee Krümel account",
    forgot: "Reset your Kaffee Krümel password",
    "change-phone": "Confirm your new phone number",
  };

  // Mail is disabled in local dev by default — print the code so the flow
  // can still be tested end-to-end without real Resend credentials.
  if (process.env.MAIL_ENABLED !== "true") {
    console.log(`[mail] OTP for ${to} (${purpose}): ${code}`);
  }

  await sendMail({
    to,
    subject: subjectByPurpose[purpose] || "Your Kaffee Krümel verification code",
    htmlContent: `
      <div style="font-family:sans-serif;font-size:15px;color:#111">
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>This code expires in 3 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
