// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const Enquiry = require('./models/enquiry');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS — in dev allow everything; restrict to your domain in production
app.use(cors());

// simple rate limiter for API endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkvault';
mongoose.connect(MONGO)

  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

// POST /api/enquiries - save enquiry
app.post('/api/enquiries', async (req, res) => {
  try {
    const { parkingId, name, phone } = req.body;
    if (!parkingId || !name || !phone) {
      return res.status(400).json({ error: 'parkingId, name and phone are required' });
    }

    // basic sanitization
    const clean = {
      parkingId: String(parkingId).trim().slice(0, 100),
      name: String(name).trim().slice(0, 200),
      phone: String(phone).replace(/[^\d+]/g, '').slice(0, 30),
    };

    if (clean.phone.length < 7) {
      return res.status(400).json({ error: 'invalid phone' });
    }

    const created = await Enquiry.create({
      parkingId: clean.parkingId,
      name: clean.name,
      phone: clean.phone,
    });

    // In production: trigger email/SMS/notification here

    return res.json({ ok: true, id: created._id });
  } catch (err) {
    console.error('Error saving enquiry', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Optional: simple list of parkings (hardcoded for now). Replace with DB later.
app.get('/api/parkings', (req, res) => {
  return res.json([
    { id: 'marina_chennai', name: 'Marina Beach - Chennai' },
    { id: 'evp_filmcity', name: 'EVP Film City - Chennai' },
    { id: 'vr_mall', name: 'VR Mall - Chennai' },
    { id: 'satyam_cinemas', name: 'Satyam Cinemas - Chennai' }
  ]);
});

// Serve static frontend (if you put your built files into ./public)
app.use(express.static(path.join(__dirname, 'public')));

// fallback
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
