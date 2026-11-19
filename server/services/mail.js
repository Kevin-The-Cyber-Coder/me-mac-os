import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter = null

export const mailConfigured = () => Boolean(env.smtp.host)

function getTransporter() {
  if (!mailConfigured()) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  }
  return transporter
}

const brand = `
  <div style="background:#070912;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#e8ecff">
    <div style="max-width:560px;margin:0 auto;background:linear-gradient(160deg,#0d1226,#0a0d1a);border:1px solid #1e2540;border-radius:18px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid #1e2540;background:linear-gradient(90deg,rgba(124,92,255,.18),rgba(34,211,238,.10))">
        <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#9aa6ff">Kevin The Cyber Coder</div>
        <div style="font-size:12px;color:#6b7699;margin-top:4px">Mukeshimana Kevin · Full-Stack Developer</div>
      </div>
      <div style="padding:28px">{{CONTENT}}</div>
      <div style="padding:18px 28px;border-top:1px solid #1e2540;font-size:11px;color:#5c6788">
        Building Tomorrow's Technology, One Innovation at a Time.<br/>
        You are receiving this email because you interacted with kevinthecybercoder.dev.
      </div>
    </div>
  </div>`

const wrap = (content) => brand.replace('{{CONTENT}}', content)

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin-top:18px;padding:11px 20px;border-radius:10px;background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#06070d;font-weight:700;text-decoration:none">${label}</a>`

export async function sendMail({ to, subject, html, text, replyTo }) {
  const tx = getTransporter()
  if (!tx) {
    // eslint-disable-next-line no-console
    console.info(`[mail:dev] "${subject}" -> ${to} (SMTP not configured; email not sent)`)
    return { delivered: false, reason: 'smtp-not-configured' }
  }
  try {
    const info = await tx.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html: html ? wrap(html) : undefined,
      text,
      replyTo,
    })
    return { delivered: true, messageId: info.messageId }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mail] delivery failed:', err.message)
    return { delivered: false, reason: err.message }
  }
}

export const mailTemplates = {
  welcome: (name = 'there', unsubscribeUrl = '#') => ({
    subject: 'Welcome to the Kevin The Cyber Coder newsletter',
    html: `<h2 style="margin:0 0 12px;font-size:20px;color:#fff">Welcome aboard, ${name} 👋</h2>
      <p style="color:#aab3d4;line-height:1.7;font-size:14px">You'll receive occasional notes on full-stack engineering, AI systems, open-source work and new projects. No spam — ever.</p>
      <p style="color:#aab3d4;line-height:1.7;font-size:14px">In the meantime, explore the interactive portfolio and say hello to ARENA AI.</p>
      ${button(env.clientUrl, 'Open the portfolio')}
      <p style="color:#5c6788;font-size:11px;margin-top:24px">Changed your mind? <a href="${unsubscribeUrl}" style="color:#8b9bff">Unsubscribe instantly</a>.</p>`,
  }),
  contactConfirm: (name = 'there', subject = '') => ({
    subject: 'Message received — Kevin The Cyber Coder',
    html: `<h2 style="margin:0 0 12px;font-size:20px;color:#fff">Thanks for reaching out, ${name}</h2>
      <p style="color:#aab3d4;line-height:1.7;font-size:14px">Your message${subject ? ` about <strong style="color:#fff">${subject}</strong>` : ''} has been received. I typically reply within 1–2 business days.</p>
      <p style="color:#aab3d4;line-height:1.7;font-size:14px">— Mukeshimana Kevin<br/><span style="color:#7c5cff">Kevin The Cyber Coder</span></p>`,
  }),
  adminContact: (data) => ({
    subject: `New contact message: ${data.subject}`,
    html: `<h2 style="margin:0 0 12px;font-size:20px;color:#fff">New portfolio inquiry</h2>
      <table style="width:100%;font-size:13px;color:#aab3d4;line-height:1.9">
        <tr><td style="color:#6b7699">Name</td><td>${data.name}</td></tr>
        <tr><td style="color:#6b7699">Email</td><td>${data.email}</td></tr>
        <tr><td style="color:#6b7699">Service</td><td>${data.service || '—'}</td></tr>
      </table>
      <div style="margin-top:16px;padding:14px;border-radius:10px;background:#0a0f1f;border:1px solid #1e2540;color:#dfe5ff;font-size:13px;line-height:1.7">${data.message}</div>
      ${button(`${env.clientUrl}/admin`, 'Open admin dashboard')}`,
  }),
  resetPassword: (name, resetUrl) => ({
    subject: 'Reset your admin password',
    html: `<h2 style="margin:0 0 12px;font-size:20px;color:#fff">Password reset requested</h2>
      <p style="color:#aab3d4;line-height:1.7;font-size:14px">Hi ${name}, use the button below to choose a new password. This link expires in 30 minutes. If you did not request this, you can ignore the email.</p>
      ${button(resetUrl, 'Reset password')}`,
  }),
  campaign: (subject, content) => ({
    subject,
    html: `<h2 style="margin:0 0 14px;font-size:20px;color:#fff">${subject}</h2>
      <div style="color:#aab3d4;line-height:1.8;font-size:14px">${content}</div>`,
  }),
}
