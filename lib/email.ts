import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = "alfred@reventure.ai";
const FROM_EMAIL = "Reventure AI <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendAdminNewUserNotification(
  username: string,
  email: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New account request: ${username}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Account Request</h2>
        <p>A new user has registered and is waiting for approval.</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Username:</td>
            <td style="padding: 8px;">${username}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Registered:</td>
            <td style="padding: 8px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        <br />
        <a href="${APP_URL}/admin/users"
           style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review in Admin Panel
        </a>
      </div>
    `,
  });
}

export async function sendUserApprovalNotification(
  username: string,
  email: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Reventure AI account has been approved",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Reventure AI!</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Your account has been approved. You can now log in and start generating proposals from your call recordings.</p>
        <br />
        <a href="${APP_URL}"
           style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Log In to Reventure AI
        </a>
        <br /><br />
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this account, you can ignore this email.</p>
      </div>
    `,
  });
}
