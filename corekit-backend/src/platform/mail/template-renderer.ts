/**
 * Render an HTML mail template with simple `{{var}}` interpolation.
 * Tenants can override default templates via tenant.settings.mailTemplates.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

export const MAIL_TEMPLATE_KEYS = [
  'otp',
  'passwordReset',
  'emailVerification',
  'orderConfirmation',
  'orderStatusUpdate',
] as const;

export type MailTemplateKey = (typeof MAIL_TEMPLATE_KEYS)[number];

export type MailTemplateOverride = {
  subject?: string;
  html?: string;
};

export function getTenantOverride(
  settings: Record<string, unknown> | null | undefined,
  key: MailTemplateKey,
): MailTemplateOverride | null {
  const mailTemplates = (settings as any)?.mailTemplates;
  const override = mailTemplates?.[key];
  if (!override) return null;
  if (
    typeof override !== 'object' ||
    (typeof override.html !== 'string' && typeof override.subject !== 'string')
  ) {
    return null;
  }
  return override as MailTemplateOverride;
}
