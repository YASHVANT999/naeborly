const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  salesRepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sales representative ID is required']
  },
  decisionMakerEmail: {
    type: String,
    required: [true, 'Decision maker email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  decisionMakerName: {
    type: String,
    required: [true, 'Decision maker name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  invitationToken: {
    type: String,
    unique: true,
    select: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  message: {
    type: String,
    maxLength: [500, 'Message cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
invitationSchema.index({ salesRepId: 1 });
invitationSchema.index({ decisionMakerEmail: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Virtual for checking if invitation is expired
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Middleware to auto-expire invitations
invitationSchema.pre('find', function() {
  this.where({ expiresAt: { $gt: new Date() } });
});

invitationSchema.pre('findOne', function() {
  this.where({ expiresAt: { $gt: new Date() } });
});

module.exports = mongoose.model('Invitation', invitationSchema);