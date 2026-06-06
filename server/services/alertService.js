import config from '../config/index.js';
import nodemailer from 'nodemailer';

class AlertService {
  constructor() {
    this.twilioReady = false;
    this.emailReady = false;
    this.init();
  }

  async init() {
    if (config.twilio?.accountSid && config.twilio.accountSid.length > 10 && !config.twilio.accountSid.startsWith('your-')) {
      try {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(config.twilio.accountSid, config.twilio.authToken);
        this.twilioReady = true;
        console.log('✅ Twilio SMS ready');
      } catch (e) { console.log('⚠️ Twilio not available:', e.message); }
    } else {
      console.log('⚠️ Twilio keys missing from .env. SMS will use device-native fallback.');
    }
    
    if (config.smtp?.user && !config.smtp.user.startsWith('your-')) {
      try {
        this.emailTransport = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: false,
          auth: { user: config.smtp.user, pass: config.smtp.pass }
        });
        this.emailReady = true;
        console.log('✅ Email alerts ready');
      } catch (e) { console.log('⚠️ Email not available:', e.message); }
    } else {
      console.log('⚠️ SMTP keys missing from .env. Email alerts will use direct delivery fallback.');
    }
  }

  // Format number to E.164 specifically for India (+91)
  formatPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    if (phone.startsWith('+')) return phone;
    return `+91${cleaned}`; // Default fallback to India
  }

  async sendPanicAlert(user, location, contacts) {
    const lat = location?.lat || location?.[0];
    const lng = location?.lng || location?.[1];
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const results = [];

    for (const contact of contacts) {
      const name = contact.name || 'Emergency Contact';
      const rawPhone = contact.phone;
      const phone = this.formatPhoneNumber(rawPhone);
      const email = contact.email;

      const smsText = `🚨 AEGESIS EMERGENCY!\n${user.name} needs help!\nTime: ${time}\nLocation: ${mapsLink}\nCall them or dial 112!`;

      // Try Twilio SMS
      if (this.twilioReady && phone) {
        try {
          await this.twilioClient.messages.create({ body: smsText, from: config.twilio.phoneNumber, to: phone });
          results.push({ contact: name, method: 'sms', status: 'sent', phone });
          console.log(`✅ SMS sent to ${name} (${phone})`);
        } catch (e) { 
          console.log(`❌ Twilio SMS failed for ${name} (${phone}):`, e.message); 
          results.push({ contact: name, method: 'sms', status: 'failed', error: e.message });
        }
      }

      // Try email via configured SMTP
      if (this.emailReady && email) {
        try {
          await this.emailTransport.sendMail({
            from: `"AEGESIS Alert" <${config.smtp.user}>`, to: email,
            subject: `🚨 EMERGENCY: ${user.name} needs help!`,
            html: this.buildEmailHTML(user.name, time, mapsLink, lat, lng),
          });
          results.push({ contact: name, method: 'email', status: 'sent', email });
          console.log(`✅ Email sent to ${name} (${email})`);
        } catch (e) { 
          console.log(`❌ Email failed for ${name}:`, e.message);
          results.push({ contact: name, method: 'email', status: 'failed', error: e.message });
        }
      }

      // If no external service is configured, use Textbelt for free automatic SMS (1 per day limit)
      if (!this.twilioReady && phone) {
        try {
          const resp = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              message: smsText,
              key: 'textbelt',
            }),
          });
          const data = await resp.json();
          if (data.success) {
            results.push({ contact: name, method: 'sms', status: 'sent', phone });
            console.log(`✅ Free SMS sent to ${name} (${phone}) via Textbelt`);
          } else {
            console.log(`❌ Free SMS failed for ${name} (${phone}):`, data.error);
            // Fallback to direct method if Textbelt fails (e.g. quota exceeded)
            const smsLink = `sms:${phone}?body=${encodeURIComponent(smsText)}`;
            results.push({ contact: name, method: 'direct', status: 'ready', phone, smsLink, error: data.error });
          }
        } catch (e) {
          console.log(`❌ Textbelt Error:`, e.message);
          const smsLink = `sms:${phone}?body=${encodeURIComponent(smsText)}`;
          results.push({ contact: name, method: 'direct', status: 'ready', phone, smsLink });
        }
      }

      if (!this.emailReady && email) {
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(`🚨 EMERGENCY: ${user.name} needs help!`)}&body=${encodeURIComponent(smsText)}`;
        results.push({ contact: name, method: 'email-direct', status: 'ready', email, mailtoLink });
      }
    }
    return results;
  }

  buildEmailHTML(userName, time, mapsLink, lat, lng) {
    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:0;border-radius:16px;overflow:hidden;border:1px solid #1e1e3a">
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">🚨</div>
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">EMERGENCY ALERT</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">AEGESIS Safety Platform</p>
        </div>
        <div style="padding:24px">
          <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 16px">
            <strong style="color:#f87171">${userName}</strong> has triggered an emergency panic alert and needs immediate help.
          </p>
          <div style="background:#1a1a2e;border:1px solid #2d2d4a;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px">Alert Details</p>
            <p style="margin:0 0 4px;color:#e2e8f0"><strong>⏰ Time:</strong> ${time}</p>
            <p style="margin:0 0 4px;color:#e2e8f0"><strong>📍 Coordinates:</strong> ${lat}, ${lng}</p>
          </div>
          <a href="${mapsLink}" style="display:block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;margin:16px 0">
            📍 View Live Location on Map
          </a>
          <div style="background:#1e1b2e;border:1px solid #dc2626;border-radius:12px;padding:16px;margin:16px 0;text-align:center">
            <p style="margin:0 0 8px;color:#f87171;font-weight:600;font-size:14px">⚡ TAKE IMMEDIATE ACTION</p>
            <p style="margin:0;color:#e2e8f0;font-size:14px">Call them immediately or dial <strong style="color:#f87171;font-size:18px">112</strong> for emergency services</p>
          </div>
        </div>
        <div style="background:#0a0a14;padding:16px 24px;text-align:center;border-top:1px solid #1e1e3a">
          <p style="margin:0;color:#64748b;font-size:11px">Sent by AEGESIS • AI-Powered Women Safety Platform</p>
        </div>
      </div>`;
  }
}

export default new AlertService();
