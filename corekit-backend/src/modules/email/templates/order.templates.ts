/**
 * HTML email templates for order lifecycle events.
 * In production, swap these with a templating engine (Handlebars, mjml, etc.)
 */

export interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; unitPrice: string; total: string }[];
  subtotal: string;
  tax: string;
  shipping: string;
  discount: string;
  grandTotal: string;
  currency: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod?: string;
}

const styles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 24px; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 32px; }
  .greeting { font-size: 18px; color: #18181b; margin-bottom: 16px; }
  .order-id { background: #f0f0ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center; }
  .order-id span { font-size: 20px; font-weight: 700; color: #6366f1; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; padding: 8px 12px; background: #f9fafb; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #f4f4f5; font-size: 14px; color: #3f3f46; }
  .totals td { border: none; padding: 4px 12px; }
  .totals .grand { font-size: 18px; font-weight: 700; color: #18181b; border-top: 2px solid #e4e4e7; padding-top: 12px; }
  .address-box { background: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .address-box h3 { margin: 0 0 8px; font-size: 14px; color: #71717a; text-transform: uppercase; }
  .address-box p { margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.6; }
  .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; }
`;

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (currency === 'INR') return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return `${currency} ${num.toFixed(2)}`;
}

export function orderConfirmationTemplate(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.unitPrice, data.currency)}</td>
          <td style="text-align:right">${formatCurrency(item.total, data.currency)}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><style>${styles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your purchase</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${data.customerName},</p>
      <p>Your order has been placed successfully. Here are the details:</p>

      <div class="order-id">
        <span>${data.orderNumber}</span>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(data.subtotal, data.currency)}</td></tr>
        <tr><td>Tax (GST)</td><td style="text-align:right">${formatCurrency(data.tax, data.currency)}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right">${formatCurrency(data.shipping, data.currency)}</td></tr>
        ${data.discount !== '0' ? `<tr><td>Discount</td><td style="text-align:right">-${formatCurrency(data.discount, data.currency)}</td></tr>` : ''}
        <tr class="grand"><td>Grand Total</td><td style="text-align:right">${formatCurrency(data.grandTotal, data.currency)}</td></tr>
      </table>

      ${data.paymentMethod ? `<p><strong>Payment:</strong> ${data.paymentMethod}</p>` : ''}

      <div class="address-box">
        <h3>📦 Shipping To</h3>
        <p>
          ${data.shippingAddress.fullName}<br>
          ${data.shippingAddress.line1}<br>
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}<br>
          📞 ${data.shippingAddress.phone}
        </p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated email from CoreKit. Do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

export function orderStatusUpdateTemplate(
  customerName: string,
  orderNumber: string,
  newStatus: string,
  note?: string,
): string {
  const statusColors: Record<string, string> = {
    CONFIRMED: '#22c55e',
    PROCESSING: '#f59e0b',
    SHIPPED: '#3b82f6',
    COMPLETED: '#6366f1',
    CANCELLED: '#ef4444',
    REFUNDED: '#f97316',
  };

  const color = statusColors[newStatus] || '#6366f1';

  return `<!DOCTYPE html>
<html>
<head><style>${styles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, ${color}, ${color}dd)">
      <h1>Order Update</h1>
      <p>${orderNumber}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${customerName},</p>
      <p>Your order status has been updated:</p>
      <div class="order-id">
        <span style="color: ${color}">${newStatus.replace('_', ' ')}</span>
      </div>
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated email from CoreKit. Do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}
