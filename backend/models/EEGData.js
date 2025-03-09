// models/EEGData.js - EEG Data model
const mongoose = require('mongoose');

const eegDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalFilename: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    required: true,
    enum: ['edf', 'bdf', 'vhdr', 'set', 'fif', 'cnt', 'npy'],
    lowercase: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  metadata: {
    subject: {
      id: String,
      age: Number,
      gender: String,
      group: String
    },
    session: String,
    task: String,
    acquisition: String,
    channels: Number,
    sampleRate: Number,
    duration: Number
  },
  bidsCompliant: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String,
  svm_analysis: {
    requested: Boolean,
    performed: Boolean,
    in_progress: Boolean,
    result: String,
    confidence: Number,
    performed_at: Date,
    error: String,
    details: mongoose.Schema.Types.Mixed
  },
  dataUrl: String,
  // For storing the EEG data in MongoDB
  // (for small files or when GridFS isn't used)
  data: Buffer,
  // For GridFS reference (for larger files)
  gridFsId: mongoose.Schema.Types.ObjectId
});

// Create indexes for efficient queries
eegDataSchema.index({ userId: 1, uploadDate: -1 });
eegDataSchema.index({ 'metadata.subject.id': 1 });
eegDataSchema.index({ tags: 1 });
eegDataSchema.index({ format: 1 });
eegDataSchema.index({ bidsCompliant: 1 });

// Instance method to request SVM analysis
eegDataSchema.methods.requestAnalysis = function() {
  this.svm_analysis = {
    requested: true,
    performed: false,
    in_progress: false
  };
  return this.save();
};

// Static method to find EEG data for a specific user
eegDataSchema.statics.findByUser = function(userId) {
  return this.find({ userId })
    .sort({ uploadDate: -1 })
    .select('-data'); // Exclude binary data from results
};

// Virtual for file extension
eegDataSchema.virtual('fileExtension').get(function() {
  return this.format ? `.${this.format.toLowerCase()}` : '';
});

const EEGData = mongoose.model('EEGData', eegDataSchema);

module.exports = EEGData;