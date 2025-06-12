const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  salesRepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sales representative ID is required']
  },
  decisionMakerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Decision maker ID is required']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Post-call evaluation fields
  salesRepRating: {
    type: Number,
    min: 1,
    max: 5
  },
  decisionMakerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  salesRepFeedback: {
    type: String,
    maxLength: [500, 'Feedback cannot exceed 500 characters']
  },
  decisionMakerFeedback: {
    type: String,
    maxLength: [500, 'Feedback cannot exceed 500 characters']
  },
  outcome: {
    type: String,
    enum: ['interested', 'not_interested', 'follow_up_needed', 'closed_deal', 'no_decision'],
    default: 'no_decision'
  },
  followUpDate: {
    type: Date
  },
  dealValue: {
    type: Number,
    min: 0
  },
  // Call quality metrics
  connectionQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  wasOnTime: {
    type: Boolean,
    default: true
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  recordingUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
callSchema.index({ salesRepId: 1 });
callSchema.index({ decisionMakerId: 1 });
callSchema.index({ scheduledAt: 1 });
callSchema.index({ status: 1 });
callSchema.index({ outcome: 1 });

// Virtual for actual duration
callSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for overall rating
callSchema.virtual('averageRating').get(function() {
  if (this.salesRepRating && this.decisionMakerRating) {
    return (this.salesRepRating + this.decisionMakerRating) / 2;
  }
  return null;
});

// Virtual for checking if call is upcoming
callSchema.virtual('isUpcoming').get(function() {
  return this.scheduledAt > new Date() && this.status === 'scheduled';
});

// Virtual for checking if call is overdue
callSchema.virtual('isOverdue').get(function() {
  return this.scheduledAt < new Date() && this.status === 'scheduled';
});

module.exports = mongoose.model('Call', callSchema);