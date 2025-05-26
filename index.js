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


// These functions assume a `property` object is passed with fields:
// name, location, type, size, price, description, image

function formatSlot(slot) {
  const dateObj = typeof slot === 'string' ? new Date(slot) : (slot instanceof Date ? slot : new Date(slot?.slot));
  if (!dateObj || isNaN(dateObj)) return String(slot);
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

async function sendBookingEmail({ to, name, slot, title, property }) {
  const formattedSlot = formatSlot(slot);
  const propertyHtml = property ? `
    <h3>Property Details</h3>
    <p><strong>${property.name}</strong></p>
    <p>${property.location}</p>
    <p>Type: ${property.type}, Size: ${property.size}, Price: ₹${property.price.toLocaleString()}</p>
    <p>${property.description}</p>
    ${property.image ? `<img src="${property.image}" width="500" style="margin-top: 10px;" />` : ''}
  ` : '';

  const emailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #2e6da4;">Appointment Confirmation</h2>
    <p>Dear ${name},</p>
    <p>Thank you for scheduling your appointment with us. This is a confirmation that your booking has been successfully completed.</p>
    <table style="margin-top: 15px; border-collapse: collapse;">
      <tr><td style="padding: 6px 10px;"><strong>Appointment Title:</strong></td><td style="padding: 6px 10px;">${title}</td></tr>
      <tr><td style="padding: 6px 10px;"><strong>Scheduled Time:</strong></td><td style="padding: 6px 10px;">${formattedSlot}</td></tr>
    </table>
    ${propertyHtml}
    <p>We look forward to speaking with you.</p>
    <p>Best regards,<br><strong>Your Appointment Team</strong></p>
  </div>`;

  const adminBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #2e6da4;">New Appointment Booked</h2>
    <p>A new appointment has been booked by ${name} (${to}).</p>
    <table style="margin-top: 15px; border-collapse: collapse;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${formattedSlot}</td></tr>
    </table>
    ${propertyHtml}
  </div>`;

  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to, subject: 'Your Appointment is Confirmed ✅', html: emailBody });
  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to: ADMIN_EMAIL, subject: '🔔 New Appointment Booked', html: adminBody });
}

async function sendRescheduleEmail({ to, name, slot, title, newSlot, property }) {
  const formattedSlot = formatSlot(slot);
  const formattedNewSlot = formatSlot(newSlot);
  const propertyHtml = property ? `
    <h3>Property Details</h3>
    <p><strong>${property.name}</strong></p>
    <p>${property.location}</p>
    <p>Type: ${property.type}, Size: ${property.size}, Price: ₹${property.price.toLocaleString()}</p>
    <p>${property.description}</p>
    ${property.image ? `<img src="${property.image}" width="500" style="margin-top: 10px;" />` : ''}
  ` : '';

  const rescheduleEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #f0ad4e;">Appointment Rescheduled</h2>
    <p>Dear ${name},</p>
    <p>Your appointment has been successfully rescheduled.</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Old Time:</strong></td><td>${formattedSlot}</td></tr>
      <tr><td><strong>New Time:</strong></td><td>${formattedNewSlot}</td></tr>
    </table>
    ${propertyHtml}
    <p>We look forward to seeing you then.</p>
    <p>Best regards,<br><strong>Your Appointment Team</strong></p>
  </div>`;

  const adminBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #f0ad4e;">Appointment Rescheduled</h2>
    <p>${name} (${to}) has rescheduled their appointment.</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Old Time:</strong></td><td>${formattedSlot}</td></tr>
      <tr><td><strong>New Time:</strong></td><td>${formattedNewSlot}</td></tr>
    </table>
    ${propertyHtml}
  </div>`;

  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to, subject: 'Your Appointment has been Rescheduled ⏰', html: rescheduleEmailBody });
  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to: ADMIN_EMAIL, subject: '🔄 Appointment Rescheduled', html: adminBody });
}

async function sendCancelEmail({ to, name, slot, title, cancellationReason, property }) {
  const formattedSlot = formatSlot(slot);
  const propertyHtml = property ? `
    <h3>Property Details</h3>
    <p><strong>${property.name}</strong></p>
    <p>${property.location}</p>
    <p>Type: ${property.type}, Size: ${property.size}, Price: ₹${property.price.toLocaleString()}</p>
    <p>${property.description}</p>
    ${property.image ? `<img src="${property.image}" width="500" style="margin-top: 10px;" />` : ''}
  ` : '';

  const cancelEmailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #d9534f;">Appointment Cancelled</h2>
    <p>Dear ${name},</p>
    <p>Your appointment has been cancelled.</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Scheduled Time:</strong></td><td>${formattedSlot}</td></tr>
      <tr><td><strong>Reason:</strong></td><td>${cancellationReason || 'Not specified'}</td></tr>
    </table>
    ${propertyHtml}
    <p>If you'd like to rebook, please visit our site anytime.</p>
    <p>Warm regards,<br><strong>Your Appointment Team</strong></p>
  </div>`;

  const adminBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
    <h2 style="color: #d9534f;">Appointment Cancelled</h2>
    <p>${name} (${to}) has cancelled their appointment.</p>
    <table style="margin-top: 15px;">
      <tr><td><strong>Title:</strong></td><td>${title}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${formattedSlot}</td></tr>
      <tr><td><strong>Reason:</strong></td><td>${cancellationReason || 'Not specified'}</td></tr>
    </table>
    ${propertyHtml}
  </div>`;

  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to, subject: 'Your Appointment has been Cancelled ❌', html: cancelEmailBody });
  await transporter.sendMail({ from: `Appointment Bot <${EMAIL_USERNAME}>`, to: ADMIN_EMAIL, subject: '❌ Appointment Cancelled', html: adminBody });
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



// Create a new booking 
app.post('/api/appointments', async (req, res) => {
  const { name, email, slot, title, description, property_id } = req.body;

  try {
    // Check for conflicts
    const conflict = await pool.query(
      'SELECT * FROM appointments WHERE slot = $1 AND status = $2',
      [slot, 'booked']
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Slot already booked' });
    }

    // Insert appointment
    const result = await pool.query(
      `INSERT INTO appointments (name, email, slot, title, description, property_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'booked') RETURNING *`,
      [name, email, slot, title, description, property_id]
    );

    // Fetch property details
    const property = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [property_id]
    );
    const prop = property.rows[0];

    // Send confirmation email
    await sendBookingEmail({ 
      to: email, 
      name, 
      slot, 
      title, 
      property: prop || null 
    });

    res.status(201).json({ message: 'Appointment booked and email sent.', appointment: result.rows[0] });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Cancel a booking
app.post('/api/appointments/:email/cancel', async (req, res) => {
  const { email } = req.params;
  const { cancellationReason } = req.body;

  try {
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
    const propertyId = appointment.rows[0].property_id;

    const property = await pool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);

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
      cancellationReason: cancellationReason || 'User requested cancellation',
      property: property.rows[0] || null
    });

    res.json({ message: 'Booking cancelled', data: result.rows[0] });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments/:email/reschedule', async (req, res) => {
  const { email } = req.params;
  const { newDateTime } = req.body;

  try {
    const availability = await pool.query(
      'SELECT * FROM appointments WHERE slot = $1 AND status = $2',
      [newDateTime, 'booked']
    );
    if (availability.rows.length > 0) {
      return res.status(409).json({ error: 'New slot not available' });
    }

    const originalAppointment = await pool.query(
      `SELECT * FROM appointments 
       WHERE email = $1 AND slot > NOW() AND status IN ('booked', 'rescheduled')
       ORDER BY slot ASC LIMIT 1`,
      [email]
    );
    if (originalAppointment.rowCount === 0) {
      return res.status(404).json({ error: 'No upcoming booking found for this email' });
    }

    const original = originalAppointment.rows[0];
    const property = await pool.query('SELECT * FROM properties WHERE id = $1', [original.property_id]);

    const result = await pool.query(
      `UPDATE appointments SET slot = $1, status = 'rescheduled' WHERE id = $2 RETURNING *`,
      [newDateTime, original.id]
    );

    await sendRescheduleEmail({ 
      to: result.rows[0].email, 
      name: result.rows[0].name, 
      slot: original, 
      newSlot: newDateTime, 
      title: result.rows[0].title,
      property: property.rows[0] || null
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
      `SELECT id, title, listing_url, price_eur, property_type, bedrooms, area_sqm, energy_rating, status
       FROM properties
       ORDER BY id ASC`
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