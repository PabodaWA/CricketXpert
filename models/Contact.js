const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'responded'],
    default: 'pending',
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactUsSchema);
