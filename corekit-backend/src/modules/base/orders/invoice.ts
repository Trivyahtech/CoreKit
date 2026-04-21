type InvoiceAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

type InvoiceItem = {
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
};

type InvoiceOrder = {
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  paymentStatus: string;
  currencyCode?: string | null;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  grandTotal: string;
  customerNote?: string | null;
  items: InvoiceItem[];
  shippingAddress: InvoiceAddress;
  billingAddress?: InvoiceAddress | null;
  user?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
  payments?: Array<{ method: string; status: string }>;
};

type InvoiceTenant = {
  name: string;
  slug: string;
  settings?: Record<string, unknown> | null;
};

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtMoney(value: string, currency = "INR") {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  if (currency === "INR") {
    return `₹${n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency} ${n.toFixed(2)}`;
}

export function renderInvoiceHtml(
  order: InvoiceOrder,
  tenant: InvoiceTenant,
): string {
  const currency = order.currencyCode || "INR";
  const settings = (tenant.settings as Record<string, unknown>) || {};
  const supportEmail = (settings.supportEmail as string) || "";
  const supportPhone = (settings.supportPhone as string) || "";
  const payment = order.payments?.[0];

  const itemRows = order.items
    .map(
      (it) => `
        <tr>
          <td>${escapeHtml(it.productName)}${
        it.variantName ? `<div class="sub">${escapeHtml(it.variantName)}</div>` : ""
      }</td>
          <td class="num">${it.quantity}</td>
          <td class="num">${fmtMoney(it.unitPrice, currency)}</td>
          <td class="num">${fmtMoney(it.totalAmount, currency)}</td>
        </tr>
      `,
    )
    .join("");

  const billing = order.billingAddress ?? order.shippingAddress;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice — ${escapeHtml(order.orderNumber)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937; background: #f3f4f6; margin: 0; padding: 32px 16px;
  }
  .sheet {
    max-width: 860px; margin: 0 auto; background: #fff;
    border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    padding: 40px; position: relative;
  }
  .bar { height: 6px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #f59e0b);
    border-radius: 12px 12px 0 0; position: absolute; top: 0; left: 0; right: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 12px; }
  .brand { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: 0.3px; }
  .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .label { color: #6b7280; font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin: 32px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th {
    background: #f9fafb; text-align: left;
    padding: 10px 12px; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }
  tbody td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  tbody tr:last-child td { border-bottom: none; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .sub { color: #6b7280; font-size: 12px; margin-top: 2px; }
  .totals { margin-top: 20px; margin-left: auto; width: 360px; font-size: 14px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #e5e7eb; padding-top: 10px;
    margin-top: 8px; font-weight: 800; font-size: 16px; color: #111827; }
  .addr { font-size: 13px; line-height: 1.55; color: #374151; }
  .addr strong { color: #111827; }
  .status-pill {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 2px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .st-completed, .st-confirmed, .st-captured { background: #d1fae5; color: #065f46; }
  .st-shipped, .st-processing, .st-authorized { background: #dbeafe; color: #1e3a8a; }
  .st-cancelled, .st-refunded, .st-failed { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6;
    display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
  .note { background: #fffbeb; color: #92400e; padding: 10px 12px;
    border-radius: 8px; font-size: 13px; margin-top: 16px; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #111827;
    color: #fff; border: 0; padding: 10px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; padding: 24px; }
    .print-btn { display: none; }
    .bar { position: static; margin: -24px -24px 12px; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="sheet">
  <div class="bar"></div>

  <div class="header">
    <div>
      <div class="brand">${escapeHtml(tenant.name)}</div>
      <div class="meta">Tax Invoice</div>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(order.orderNumber)}</strong></div>
      <div>${fmtDate(order.createdAt)}</div>
      <div style="margin-top: 6px;">
        <span class="status-pill st-${order.status.toLowerCase()}">${escapeHtml(order.status)}</span>
        <span class="status-pill st-${order.paymentStatus.toLowerCase()}">${escapeHtml(order.paymentStatus)}</span>
      </div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Billed to</div>
      <div class="addr">
        <strong>${escapeHtml(billing.fullName)}</strong><br>
        ${escapeHtml(billing.line1)}${billing.line2 ? ", " + escapeHtml(billing.line2) : ""}<br>
        ${escapeHtml(billing.city)}, ${escapeHtml(billing.state)} ${escapeHtml(billing.pincode)}<br>
        ${escapeHtml(billing.phone)}
        ${order.user?.email ? `<br><span style="color:#6b7280">${escapeHtml(order.user.email)}</span>` : ""}
      </div>
    </div>
    <div>
      <div class="label">Ship to</div>
      <div class="addr">
        <strong>${escapeHtml(order.shippingAddress.fullName)}</strong><br>
        ${escapeHtml(order.shippingAddress.line1)}${order.shippingAddress.line2 ? ", " + escapeHtml(order.shippingAddress.line2) : ""}<br>
        ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.pincode)}<br>
        ${escapeHtml(order.shippingAddress.phone)}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmtMoney(order.subtotal, currency)}</span></div>
    ${Number(order.discountAmount) > 0
      ? `<div class="row" style="color:#047857"><span>Discount</span><span>−${fmtMoney(order.discountAmount, currency)}</span></div>`
      : ""}
    <div class="row"><span>Tax (GST)</span><span>${fmtMoney(order.taxAmount, currency)}</span></div>
    <div class="row"><span>Shipping</span><span>${Number(order.shippingAmount) === 0 ? "Free" : fmtMoney(order.shippingAmount, currency)}</span></div>
    <div class="row grand"><span>Total</span><span>${fmtMoney(order.grandTotal, currency)}</span></div>
    ${payment ? `<div class="row" style="color:#6b7280; font-size:12px; margin-top:6px;"><span>Paid via</span><span>${escapeHtml(payment.method)} · ${escapeHtml(payment.status)}</span></div>` : ""}
  </div>

  ${order.customerNote ? `<div class="note"><strong>Note:</strong> ${escapeHtml(order.customerNote)}</div>` : ""}

  <div class="footer">
    <div>${escapeHtml(tenant.name)}${supportEmail ? " · " + escapeHtml(supportEmail) : ""}${supportPhone ? " · " + escapeHtml(supportPhone) : ""}</div>
    <div>Generated ${fmtDate(new Date())}</div>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
