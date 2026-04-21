const styles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .container { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; }
  .body { padding: 28px; color: #3f3f46; font-size: 14px; line-height: 1.6; }
  .code-box { background: #f0f0ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
  .code-box span { font-size: 30px; font-weight: 700; color: #6366f1; letter-spacing: 6px; }
  .button { display: inline-block; background: #6366f1; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; }
  .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #a1a1aa; }
`;

export function otpTemplate(code: string, ttlMinutes = 5): string {
  return `<!DOCTYPE html>
<html>
<head><style>${styles}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Your verification code</h1></div>
    <div class="body">
      <p>Use the code below to sign in. It expires in ${ttlMinutes} minutes.</p>
      <div class="code-box"><span>${code}</span></div>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer"><p>Automated email from CoreKit. Do not reply.</p></div>
  </div>
</body>
</html>`;
}

export function emailVerificationTemplate(
  verifyUrl: string,
  ttlMinutes = 1440,
): string {
  return `<!DOCTYPE html>
<html>
<head><style>${styles}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Verify your email</h1></div>
    <div class="body">
      <p>Welcome aboard! Please confirm this is your email address. The link below is valid for ${Math.round(ttlMinutes / 60)} hours.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a class="button" href="${verifyUrl}">Verify email</a>
      </p>
      <p style="font-size: 12px; color: #71717a; word-break: break-all;">Or paste this URL into your browser:<br>${verifyUrl}</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer"><p>Automated email from CoreKit. Do not reply.</p></div>
  </div>
</body>
</html>`;
}

export function passwordResetTemplate(resetUrl: string, ttlMinutes = 30): string {
  return `<!DOCTYPE html>
<html>
<head><style>${styles}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Reset your password</h1></div>
    <div class="body">
      <p>We got a request to reset your password. The link below expires in ${ttlMinutes} minutes.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a class="button" href="${resetUrl}">Reset password</a>
      </p>
      <p style="font-size: 12px; color: #71717a; word-break: break-all;">Or paste this URL into your browser:<br>${resetUrl}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer"><p>Automated email from CoreKit. Do not reply.</p></div>
  </div>
</body>
</html>`;
}
