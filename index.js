// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
//const { insertEventToCalendar } = require('./calender');
const nodemailer = require('nodemailer');
const { sendTelegramMessage } = require('./telegram');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

 const pool = new Pool({
  user: 'umhre9bpwaa0kdlwaffy',
  host: 'brcn63rrvzidwfsxpiiz-postgresql.services.clever-cloud.com',
  database: 'brcn63rrvzidwfsxpiiz',
  password: 'BQntnQejUZvCo4v3mKbKeLpzuVF142',
  port: 50013
});

// Initialize DB
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      uid TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      slot TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'booked',
      title TEXT,
      description TEXT
    );
  `);
};
initDB();

const session = require('express-session');
const {
  getAuthUrl,
  setCredentialsFromCode,
  getOAuthClientWithToken
} = require('./googleAuth');

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));


// Redirect to Google's consent screen
app.get('/auth/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Handle callback
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const tokens = await setCredentialsFromCode(code);
  req.session.tokens = tokens;
  res.send('✅ Authenticated! You can now book calendar events.');
});


// email setup
const EMAIL_USERNAME = 'pragarajesh779jd@gmail.com';
const ADMIN_EMAIL = 'pragarajesh779jd@gmail.com'; // Admin email (same as sender in this case)


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USERNAME,
    pass: 'gxor matm vkmz lmwe'
  }
});


async function sendBookingEmail({ to, name, slot, title }) {
  const emailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #2e6da4;">Appointment Confirmation</h2>
    
    <p>Dear ${name},</p>

    <p>Thank you for scheduling your appointment with us. This is a confirmation that your booking has been successfully completed.</p>

    <table style="margin-top: 15px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 10px;"><strong>Appointment Title:</strong></td>
        <td style="padding: 6px 10px;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px;"><strong>Scheduled Time:</strong></td>
        <td style="padding: 6px 10px;">${new Date(slot).toLocaleString()}</td>
      </tr>
    </table>

    <p>If you have any questions or need to reschedule, feel free to contact us.</p>

    <p>We look forward to speaking with you.</p>

    <p>Best regards,<br><strong>Your Appointment Team</strong></p>
  </div>
`;
  
  // Send email to the customer
  await transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to,
    subject: 'Your Appointment is Confirmed ✅',
    html: emailBody
  });
  
  // Send notification email to the admin
  const adminEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #2e6da4;">New Appointment Notification</h2>
    
    <p>A new appointment has been booked:</p>

    <table style="margin-top: 15px; border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Name:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Email:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${to}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Appointment Title:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Scheduled Time:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${new Date(slot).toLocaleString()}</td>
      </tr>
    </table>

    <p>This is an automated notification.</p>
  </div>
`;
  
  // Send notification email to admin
  return transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to: ADMIN_EMAIL,
    subject: '🔔 New Appointment Booked',
    html: adminEmailBody
  });
}

async function sendRescheduleEmail({ to, name, slot, title, newSlot }) {
  const rescheduleEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #f0ad4e;">Appointment Rescheduled</h2>
    <p>Dear ${name},</p>
    <p>Your appointment has been successfully rescheduled. Here are your updated appointment details:</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>New Date & Time:</strong></td><td>${new Date(newSlot).toLocaleString()}</td></tr>
    </table>
    <p>If this new time doesn't work for you, please let us know at your earliest convenience.</p>
    <p>Thank you for choosing us.</p>
    <p>Best regards,<br><strong>Your Appointment Team</strong></p>
  </div>
`;

  // Send email to the customer
  await transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to,
    subject: 'Your Appointment has been Rescheduled ⏰',
    html: rescheduleEmailBody
  });
  
  // Send notification email to the admin
  const adminRescheduleEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #f0ad4e;">Appointment Rescheduled Notification</h2>
    
    <p>An appointment has been rescheduled:</p>

    <table style="margin-top: 15px; border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Name:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Email:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${to}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Appointment Title:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Original Time:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${new Date(slot).toLocaleString()}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>New Time:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${new Date(newSlot).toLocaleString()}</td>
      </tr>
    </table>

    <p>This is an automated notification.</p>
  </div>
`;
  
  // Send notification email to admin
  return transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to: ADMIN_EMAIL,
    subject: '🔄 Appointment Rescheduled',
    html: adminRescheduleEmailBody
  });
}

async function sendCancelEmail({ to, name, slot, title, cancellationReason }) {
  const cancelEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #d9534f;">Appointment Cancelled</h2>
    <p>Dear ${name},</p>
    <p>We would like to confirm that your appointment has been successfully cancelled.</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Original Date & Time:</strong></td><td>${new Date(slot).toLocaleString()}</td></tr>
    </table>
    <p><strong>Reason for Cancellation:</strong> ${cancellationReason || 'Not specified'}</p>
    <p>If you'd like to reschedule or have any questions, please don't hesitate to contact us.</p>
    <p>Best regards,<br><strong>Your Appointment Team</strong></p>
  </div>
`;

  // Send email to the customer
  await transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to,
    subject: 'Your Appointment has been Cancelled ❌',
    html: cancelEmailBody
  });
  
  // Send notification email to the admin
  const adminCancelEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #d9534f;">Appointment Cancellation Notification</h2>
    
    <p>An appointment has been cancelled:</p>

    <table style="margin-top: 15px; border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Name:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Client Email:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${to}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Appointment Title:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Original Time:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${new Date(slot).toLocaleString()}</td>
      </tr>
      <tr style="background-color: #f2f2f2;">
        <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>Cancellation Reason:</strong></td>
        <td style="padding: 8px 12px; border: 1px solid #ddd;">${cancellationReason || 'Not specified'}</td>
      </tr>
    </table>

    <p>This is an automated notification.</p>
  </div>
`;
  
  // Send notification email to admin
  return transporter.sendMail({
    from: `Appointment Bot <${EMAIL_USERNAME}>`,
    to: ADMIN_EMAIL,
    subject: '❌ Appointment Cancelled',
    html: adminCancelEmailBody
  });
}

// show Availability

app.get('/api/availability', async (req, res) => {
  const today = DateTime.local().startOf('day');
  const slots = [
    today.set({ hour: 9, minute: 0 }),
    today.set({ hour: 10, minute: 0 }),
    today.set({ hour: 11, minute: 0 }),
    today.set({ hour: 14, minute: 0 }),
    today.set({ hour: 15, minute: 0 })
  ];

  try {
    const slotTimes = slots.map(s => s.toISO());

    const result = await pool.query(
      `SELECT slot FROM appointments WHERE slot = ANY($1::timestamptz[]) AND status = 'booked'`,
      [slotTimes]
    );

    const bookedSet = new Set(result.rows.map(r => DateTime.fromISO(r.slot).toISO()));

    const availability = slots.map(slot => ({
      slot: slot.toISO(),
      status: bookedSet.has(slot.toISO()) ? 'busy' : 'free'
    }));

    res.json({ availability });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ error: err.message });
  }
});


// Get all upcoming bookings by email
app.get('/api/appointments', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Missing required query parameter: email' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM appointments WHERE email = $1 AND slot > NOW() AND status IN ('booked', 'rescheduled') ORDER BY slot ASC`,
      [email]
    );

    // Check if appointments exist
    if (result.rows.length === 0) {
      return res.json({ appointments: [], message: 'No upcoming bookings found.' });
    }

    // Return appointments with uid included in each record (assuming uid is a column)
    res.json({
      appointments: result.rows.map(row => ({
        uid: row.uid,
        slot: row.slot,
        title: row.title,       // if applicable
        status: row.status,
        email: row.email,
        // add any other fields you want to return
      }))
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
});


// Get a booking by UID
app.get('/api/appointments/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await pool.query('SELECT * FROM appointments WHERE uid = $1', [uid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new booking (updated to match new body structure)
app.post('/api/appointments', async (req, res) => {
  const { name, email, title, description, slot } = req.body;
  const tokens = req.session.tokens;

  //if (!tokens) return res.status(401).json({ error: 'Not authenticated with Google' });

  try {
    const check = await pool.query(
      'SELECT * FROM appointments WHERE slot = $1 AND status = $2',
      [slot, 'booked']
    );
    if (check.rows.length > 0)
      return res.status(409).json({ error: 'Slot already booked' });

    const result = await pool.query(
      `INSERT INTO appointments (name, email, slot, title, description) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, slot, title, description]
    );
/* 
    // Add to Google Calendar
    await createCalendarEvent(tokens, {
      title,
      description,
      slot,
      email
    }); */

    // Send Telegram message
      await sendTelegramMessage({
      chatId: '1301518677',
      token: '7998442263:AAHwuYjIy_XVuX_W-c_NNR89_9uNhxnBFPI',
      message: `📅 Appointment Confirmed!\nName: ${name}\nEmail: ${email}\nSlot: ${slot}\nTitle: ${title}`
    });

    await sendBookingEmail({ to: email, name, slot, title });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: err.message });
  }
});


// Cancel a booking
app.post('/api/appointments/:email/cancel', async (req, res) => {
  const { email } = req.params;
  const { cancellationReason } = req.body;

  try {
    // Get the user's next upcoming booked appointment
    const appointment = await pool.query(
      `SELECT * FROM appointments 
       WHERE email = $1 AND slot > NOW() AND status IN ('booked', 'rescheduled')
       ORDER BY slot ASC LIMIT 1`,
      [email]
    );

    if (appointment.rowCount === 0) {
      return res.status(404).json({ error: 'No upcoming booking found for this email' });
    }

    const appointmentId = appointment.rows[0].id;

    // Cancel the appointment and update description with reason
    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1, 
           description = COALESCE(description, '') || '\nCancelled Reason: ' || $2 
       WHERE id = $3 
       RETURNING *`,
      ['cancelled', cancellationReason || 'User requested cancellation', appointmentId]
    );
    
    await sendCancelEmail({
      to: result.rows[0].email, 
      name: result.rows[0].name, 
      slot: result.rows[0].slot, 
      title: result.rows[0].title,
      cancellationReason: cancellationReason || 'User requested cancellation'
    });
    
    await sendTelegramMessage({
      chatId: '1301518677',
      token: '7998442263:AAHwuYjIy_XVuX_W-c_NNR89_9uNhxnBFPI',
      message: `❌ Appointment Cancelled!\nName: ${result.rows[0].name}\nEmail: ${result.rows[0].email}\nSlot: ${result.rows[0].slot}\nTitle: ${result.rows[0].title}`
    });
    res.json({ message: 'Booking cancelled', data: result.rows[0] });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reschedule a booking
app.post('/api/appointments/:email/reschedule', async (req, res) => {
  const { email } = req.params;
  const { newDateTime } = req.body;

  try {
    // Check if new slot is already booked
    const availability = await pool.query(
      'SELECT * FROM appointments WHERE slot = $1 AND status = $2',
      [newDateTime, 'booked']
    );
    if (availability.rows.length > 0) {
      return res.status(409).json({ error: 'New slot not available' });
    }

    // Get the user's latest upcoming appointment
    const originalAppointment = await pool.query(
      `SELECT * FROM appointments 
       WHERE email = $1 AND slot > NOW() AND status = 'booked' 
       ORDER BY slot ASC LIMIT 1`,
      [email]
    );
    if (originalAppointment.rowCount === 0) {
      return res.status(404).json({ error: 'No upcoming booking found for this email' });
    }

    const original = originalAppointment.rows[0];

    // Reschedule it
    const result = await pool.query(
      `UPDATE appointments SET slot = $1, status = 'rescheduled' WHERE id = $2 RETURNING *`,
      [newDateTime, original.id]
    )
    
    await sendRescheduleEmail({ 
      to: result.rows[0].email, 
      name: result.rows[0].name, 
      slot: original, 
      newSlot: newDateTime, 
      title: result.rows[0].title 
    });
    
    await sendTelegramMessage({
      chatId: '1301518677',
      token: '7998442263:AAHwuYjIy_XVuX_W-c_NNR89_9uNhxnBFPI',
      message: `📅 Appointment Rescheduled!\nName: ${result.rows[0].name}\nEmail: ${result.rows[0].email}\nNew Slot: ${newDateTime}\nTitle: ${result.rows[0].title}`
    });
    res.json({ message: 'Booking rescheduled', data: result.rows[0] });
  } catch (err) {
    console.error('Error rescheduling booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check availability for a full workday
const { DateTime } = require('luxon'); // add at the top of your file

app.get('/api/slots', async (req, res) => {
  const { startTime, endTime } = req.query;

  if (!startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required query parameters: startTime and endTime' });
  }

  try {
    const start = DateTime.fromISO(startTime, { zone: 'utc' });
    const end = DateTime.fromISO(endTime, { zone: 'utc' });

    if (!start.isValid || !end.isValid || end <= start) {
      return res.status(400).json({ error: 'Invalid startTime or endTime' });
    }

    // Fetch all booked slots within the range
    const bookedResult = await pool.query(
      `SELECT slot FROM appointments WHERE slot >= $1 AND slot <= $2 AND status = 'booked'`,
      [start.toISO(), end.toISO()]
    );
    const bookedSet = new Set(bookedResult.rows.map(r => DateTime.fromISO(r.slot).toISO()));

    // Generate all 30-min slots between start and end
    let slots = [];
    let current = start;

    while (current < end) {
      const isoSlot = current.toISO();
      const status = bookedSet.has(isoSlot) ? 'busy' : 'free';
      slots.push({ slot: isoSlot, status });
      current = current.plus({ minutes: 30 });
    }

    res.json({ startTime, endTime, slots });
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, location, price, size, type, description FROM properties ORDER BY id ASC`
    );
    res.json({ properties: result.rows });
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});