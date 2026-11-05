import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml as e, formatMoney } from '../utils/sanitize.js';

let transporter = null;
export const sentEmails = []; // inspected by the automated tests

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/** Sends an email. Never throws – a failed email must not break payment processing. */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!to) return false;
  const message = { from: env.emailFrom, to, subject, html, text, replyTo };
  if (env.isTest) {
    sentEmails.push(message);
    return true;
  }
  const t = getTransporter();
  if (!t) {
    console.log(`[email] SMTP not configured – would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const info = await t.sendMail(message);
    console.log(`[email] sent "${subject}" to ${maskEmail(to)} (${info.response || info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[email] FAILED to send "${subject}" to ${maskEmail(to)}: ${err.message}`);
    return false;
  }
}

export const maskEmail = (addr = '') => String(addr).replace(/^(.)[^@]*(@.*)$/, '$1***$2');

/**
 * Admin diagnostic: checks the SMTP login and sends a short test message.
 * Returns the provider's exact error so problems can be fixed from the dashboard.
 */
export async function sendTestEmail(to) {
  const t = getTransporter();
  const from = env.emailFrom;
  if (!t) return { ok: false, to, from, error: 'Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.' };
  try {
    await t.verify();
  } catch (err) {
    return { ok: false, to, from, error: `Could not sign in to the email server: ${err.message}` };
  }
  try {
    const info = await t.sendMail({
      from, to,
      subject: 'Test email from the House of Love website',
      text: 'This is a test email from your website. If you are reading it, receipts and confirmations can be delivered.',
      html: layout('Email is working', '<p>This is a test email from your website. If you are reading it, receipts and order confirmations can be delivered.</p>'),
    });
    console.log(`[email] test email sent to ${maskEmail(to)} (${info.response || info.messageId})`);
    return { ok: true, to, from, response: info.response || '' };
  } catch (err) {
    return { ok: false, to, from, error: `The email server refused the message: ${err.message}` };
  }
}

const layout = (title, body) => `<!doctype html><html><body style="margin:0;background:#F7F1E6;font-family:Georgia,'Times New Roman',serif;color:#2B2622">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#6B1E2E;padding:28px 32px;color:#F3E3B5;font-size:22px;letter-spacing:.5px">House of Love International Ministries</td></tr>
<tr><td style="height:6px;background:linear-gradient(90deg,#C9A24B,#6B1E2E,#C9A24B)"></td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
<h1 style="font-family:Georgia,serif;font-weight:normal;color:#6B1E2E;margin:0 0 16px">${e(title)}</h1>${body}
</td></tr>
<tr><td style="padding:20px 32px;background:#F3EBDB;font-family:Arial,sans-serif;font-size:12px;color:#5c534c">
“And now these three remain: faith, hope and love. But the greatest of these is love.” – 1 Corinthians 13:13
</td></tr></table></td></tr></table></body></html>`;

export function orderConfirmationEmail(order) {
  const rows = order.items.map((i) => `<tr><td style="padding:6px 0">${e(i.name)}${i.size ? ` · ${e(i.size)}` : ''}${i.color ? ` · ${e(i.color)}` : ''} × ${i.quantity}</td><td align="right">${formatMoney(i.lineTotal, order.currency)}</td></tr>`).join('');
  const ship = order.shippingAddress
    ? `${e(order.shippingAddress.line1)}${order.shippingAddress.line2 ? `, ${e(order.shippingAddress.line2)}` : ''}<br>${e(order.shippingAddress.city)}, ${e(order.shippingAddress.state)} ${e(order.shippingAddress.postalCode)}<br>${e(order.shippingAddress.country)}`
    : 'Pick up at church';
  const html = layout('Thank you for your order!', `
<p>Dear ${e(order.customerName)},</p>
<p>We have received your payment for order <strong>${e(order.orderNumber)}</strong>. Your support helps us share God’s love with our community.</p>
<table width="100%" style="border-collapse:collapse;border-top:1px solid #eee;margin:16px 0">${rows}
<tr><td style="padding-top:10px;border-top:1px solid #eee">Subtotal</td><td align="right" style="border-top:1px solid #eee">${formatMoney(order.subtotal, order.currency)}</td></tr>
<tr><td>Shipping (${e(order.shippingLabel)})</td><td align="right">${formatMoney(order.shippingCost, order.currency)}</td></tr>
<tr><td><strong>Total paid</strong></td><td align="right"><strong>${formatMoney(order.total, order.currency)}</strong></td></tr></table>
<p><strong>Delivery:</strong><br>${ship}</p>
<p>We will email you again when your order ships. God bless you!</p>`);
  return {
    subject: `Order confirmed – ${order.orderNumber}`,
    html,
    text: orderText(order, [
      `Dear ${order.customerName},`,
      '',
      `We have received your payment for order ${order.orderNumber}. Your support helps us share God’s love with our community.`,
    ], ['We will email you again when your order ships. God bless you!', '', 'House of Love International Ministries']),
  };
}

/** Plain-text order summary (spam filters penalise HTML emails with a one-line text part). */
function orderText(order, intro, outro) {
  const money = (n) => formatMoney(n, order.currency);
  const items = order.items.map((i) => `- ${i.name}${i.size ? ` · ${i.size}` : ''}${i.color ? ` · ${i.color}` : ''} × ${i.quantity}: ${money(i.lineTotal)}`);
  const a = order.shippingAddress;
  const delivery = a
    ? [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, a.country].filter(Boolean).join('\n')
    : 'Pick up at church';
  return [
    ...intro, '',
    'Items:', ...items, '',
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping (${order.shippingLabel}): ${money(order.shippingCost)}`,
    `Total paid: ${money(order.total)}`, '',
    'Delivery:', delivery, '',
    ...outro,
  ].join('\n');
}

/** Internal alert for the church office – deliberately different from the customer's confirmation. */
export function newOrderAlertEmail(order) {
  const money = (n) => formatMoney(n, order.currency);
  const adminUrl = `${env.clientUrl}/admin/orders/${encodeURIComponent(order.id)}`;
  const rows = order.items.map((i) => `<tr><td style="padding:4px 0">${e(i.name)}${i.size ? ` · ${e(i.size)}` : ''}${i.color ? ` · ${e(i.color)}` : ''} × ${i.quantity}</td><td align="right">${money(i.lineTotal)}</td></tr>`).join('');
  const a = order.shippingAddress;
  const ship = a ? `${e(a.line1)}${a.line2 ? `, ${e(a.line2)}` : ''}, ${e(a.city)}, ${e(a.state)} ${e(a.postalCode)}, ${e(a.country)}` : 'Pick up at church';
  const html = layout(`New store order ${order.orderNumber}`, `
<p style="background:#F3EBDB;padding:10px 14px;border-radius:8px;margin:0 0 16px"><strong>Staff notification.</strong> The customer has been sent their own confirmation at ${e(order.customerEmail)}.</p>
<p><strong>Customer:</strong> ${e(order.customerName)}<br><strong>Email:</strong> ${e(order.customerEmail)}${order.customerPhone ? `<br><strong>Phone:</strong> ${e(order.customerPhone)}` : ''}</p>
<table width="100%" style="border-collapse:collapse;border-top:1px solid #eee;margin:16px 0">${rows}
<tr><td style="padding-top:8px;border-top:1px solid #eee"><strong>Total paid</strong></td><td align="right" style="border-top:1px solid #eee"><strong>${money(order.total)}</strong></td></tr></table>
<p><strong>Delivery (${e(order.shippingLabel)}):</strong><br>${ship}</p>
<p><a href="${e(adminUrl)}" style="color:#6B1E2E">Open this order in the admin dashboard</a> to update its fulfilment status.</p>`);
  return {
    subject: `New order ${order.orderNumber} – ${money(order.total)} from ${order.customerName}`,
    html,
    text: orderText(order, [
      'STAFF NOTIFICATION – a new store order has been paid.',
      `The customer has been sent their own confirmation at ${order.customerEmail}.`,
      '',
      `Order: ${order.orderNumber}`,
      `Customer: ${order.customerName} <${order.customerEmail}>${order.customerPhone ? `, ${order.customerPhone}` : ''}`,
    ], [`Open in the admin dashboard: ${adminUrl}`]),
    replyTo: order.customerEmail,
  };
}

export function donationReceiptEmail(donation, { renewal = false } = {}) {
  const amount = formatMoney(donation.amount, donation.currency);
  const html = layout(renewal ? 'Thank you for your monthly gift' : 'Thank you for your generous gift', `
<p>Dear ${donation.anonymous ? 'Friend' : e(donation.donorName)},</p>
<p>We gratefully confirm your ${donation.frequency === 'monthly' ? 'monthly ' : ''}donation of <strong>${amount}</strong> to House of Love International Ministries.</p>
<p><strong>Reference:</strong> ${e(donation.reference)}<br><strong>Date:</strong> ${new Date(donation.completedAt || donation.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}<br>
<strong>Designation:</strong> ${e(donation.fundLabel || 'General ministry')}</p>
${donation.frequency === 'monthly' ? '<p>Your gift will repeat monthly. To change or cancel your monthly gift at any time, simply reply to this email or contact the church office.</p>' : ''}
<p>Your generosity strengthens our worship, outreach, missions and care for families. “Each of you should give what you have decided in your heart to give… for God loves a cheerful giver.” (2 Corinthians 9:7)</p>
<p style="font-size:12px;color:#6b625b">Please keep this email for your records. House of Love International Ministries does not provide tax advice; please consult the church office and your tax adviser about the tax treatment of your gift.</p>`);
  return { subject: `Donation receipt – ${donation.reference}`, html, text: `Thank you for your donation of ${amount}. Reference: ${donation.reference}.` };
}

export function contactNotificationEmail(msg) {
  return {
    subject: `Website message: ${msg.subject}`,
    html: layout('New website message', `<p><strong>From:</strong> ${e(msg.name)} &lt;${e(msg.email)}&gt;</p><p><strong>Subject:</strong> ${e(msg.subject)}</p><p style="white-space:pre-wrap">${e(msg.message)}</p>`),
    text: `${msg.name} <${msg.email}>\n${msg.subject}\n\n${msg.message}`,
  };
}

export function registrationEmail(reg, event) {
  return {
    subject: `You are registered: ${event.title}`,
    html: layout('You are registered!', `<p>Dear ${e(reg.name)},</p><p>Thank you for registering for <strong>${e(event.title)}</strong> (${reg.attendees} attendee${reg.attendees > 1 ? 's' : ''}).</p>
<p><strong>When:</strong> ${new Date(event.startDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}<br><strong>Where:</strong> ${e(event.location)}</p><p>We look forward to seeing you!</p>`),
    text: `You are registered for ${event.title}.`,
  };
}

export function fulfillmentEmail(order) {
  const labels = { shipped: 'Your order is on its way', ready_for_pickup: 'Your order is ready for pickup', delivered: 'Your order has been delivered' };
  const title = labels[order.fulfillmentStatus];
  if (!title) return null;
  return {
    subject: `${title} – ${order.orderNumber}`,
    html: layout(title, `<p>Dear ${e(order.customerName)},</p><p>Order <strong>${e(order.orderNumber)}</strong>: ${e(title.toLowerCase())}.</p>${order.trackingNumber ? `<p><strong>Tracking number:</strong> ${e(order.trackingNumber)}</p>` : ''}<p>Thank you for supporting House of Love International Ministries.</p>`),
    text: `${title}. Order ${order.orderNumber}.`,
  };
}

// ---- Staff accounts ----------------------------------------------------------
export function staffRequestAlertEmail(user) {
  const url = `${env.clientUrl}/admin/users`;
  return {
    subject: `Staff account request from ${user.name}`,
    html: layout('New staff account request', `
<p><strong>${e(user.name)}</strong> (${e(user.email)}) has asked for a staff account on the website.</p>
${user.note ? `<p><strong>Role or ministry:</strong> ${e(user.note)}</p>` : ''}
<p>The account cannot sign in until an administrator approves it. If you do not recognise this person, decline the request.</p>
<p><a href="${e(url)}" style="color:#6B1E2E">Review the request on the Staff Accounts page</a></p>`),
    text: `${user.name} <${user.email}> has asked for a staff account on the website.${user.note ? `\nRole or ministry: ${user.note}` : ''}\n\nThe account cannot sign in until an administrator approves it. If you do not recognise this person, decline the request.\n\nReview it here: ${url}`,
    replyTo: user.email,
  };
}

export function staffRequestReceivedEmail(user) {
  return {
    subject: 'Your staff account request was received',
    html: layout('Account request received', `<p>Dear ${e(user.name)},</p>
<p>Thank you for requesting a staff account for the House of Love International Ministries website. An administrator will review your request. You will receive another email when your account has been approved, and you can then sign in.</p>
<p>If you did not make this request, you can ignore this email.</p>`),
    text: `Dear ${user.name},\n\nThank you for requesting a staff account for the House of Love International Ministries website. An administrator will review your request. You will receive another email when your account has been approved, and you can then sign in.\n\nIf you did not make this request, you can ignore this email.`,
  };
}

export function staffApprovedEmail(user) {
  const url = `${env.clientUrl}/admin/login`;
  const roleText = user.role === 'admin'
    ? 'an administrator (full access, including donations and staff accounts)'
    : 'an editor (products, categories, events, orders and messages)';
  return {
    subject: 'Your staff account has been approved',
    html: layout('Your account is ready', `<p>Dear ${e(user.name)},</p>
<p>Your staff account has been approved. You have been set up as ${e(roleText)}.</p>
<p><a href="${e(url)}" style="color:#6B1E2E">Sign in here</a> with your email address and the password you chose. Remember to click <strong>Sign out</strong> when you have finished, especially on a shared computer.</p>`),
    text: `Dear ${user.name},\n\nYour staff account has been approved. You have been set up as ${roleText}.\n\nSign in here with your email address and the password you chose: ${url}\n\nRemember to click Sign out when you have finished, especially on a shared computer.`,
  };
}
