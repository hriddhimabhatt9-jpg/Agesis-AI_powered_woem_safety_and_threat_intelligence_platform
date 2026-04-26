import config from '../config/index.js';

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
      console.log('⚠️ Twilio keys missing from .env. SMS will run in DEMO mode.');
    }
    
    if (config.smtp?.user && !config.smtp.user.startsWith('your-')) {
      try {
        const nodemailer = await import('nodemailer');
        this.emailTransport = nodemailer.default.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: false, auth: { user: config.smtp.user, pass: config.smtp.pass } });
        this.emailReady = true;
        console.log('✅ Email alerts ready');
      } catch (e) { console.log('⚠️ Email not available:', e.message); }
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

      if (this.emailReady && email) {
        try {
          await this.emailTransport.sendMail({
            from: `"AEGESIS Alert" <${config.smtp.user}>`, to: email,
            subject: `🚨 EMERGENCY: ${user.name} needs help!`,
            html: `<div style="font-family:Arial;background:#1a1a2e;color:#fff;padding:30px;border-radius:12px"><h1 style="color:#ef4444">🚨 EMERGENCY ALERT</h1><p><b>${user.name}</b> triggered a panic alert.</p><p>Time: ${time}</p><p>Location: <a href="${mapsLink}" style="color:#7c3aed">${mapsLink}</a></p><p>Call them immediately or dial 112.</p></div>`,
          });
          results.push({ contact: name, method: 'email', status: 'sent', email });
          console.log(`✅ Email sent to ${name}`);
        } catch (e) { console.log(`❌ Email failed for ${name}:`, e.message); }
      }

      // Demo mode — always log if external integrations are missing
      if (!this.twilioReady && !this.emailReady) {
        console.log(`\n${'='.repeat(50)}\n🚨 PANIC ALERT (DEMO)\nTo: ${name} | ${phone || rawPhone || 'no phone'} | ${email || 'no email'}\nFrom: ${user.name}\nTime: ${time}\nMap: ${mapsLink}\n\n[WARNING] Twilio API Keys are missing in .env, so real SMS was not sent.\n${'='.repeat(50)}\n`);
        results.push({ contact: name, method: 'demo', status: 'logged', phone, email });
      }
    }
    return results;
  }
}

export default new AlertService();
