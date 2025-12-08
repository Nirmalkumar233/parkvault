// models/enquiry.js
const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  parkingId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
