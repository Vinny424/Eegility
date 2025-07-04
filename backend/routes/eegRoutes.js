// routes/eegRoutes.js - EEG data routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { handleEEGUpload, cleanupOnError } = require('../middleware/upload');
const EEGData = require('../models/EEGData');
const { processEEGFile, extractMetadata } = require('../services/eegProcessing');

// @route   POST /api/eeg/upload
// @desc    Upload a new EEG file
// @access  Private
router.post('/upload', [auth, cleanupOnError, handleEEGUpload], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Extract metadata from the file
    const fileMetadata = await extractMetadata(req.file.path);
    
    // Create new EEG data record
    const eegData = new EEGData({
      userId: req.user.id,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      format: path.extname(req.file.originalname).substring(1).toLowerCase(),
      size: req.file.size,
      metadata: {
        ...fileMetadata,
        subject: {
          id: req.body.subjectId || 'unknown',
          age: req.body.subjectAge || null,
          gender: req.body.subjectGender || 'unknown',
          group: req.body.subjectGroup || 'control'
        },
        session: req.body.session || 'unknown',
        task: req.body.task || 'unknown'
      },
      bidsCompliant: req.body.bidsCompliant === 'true',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      notes: req.body.notes || ''
    });
    
    // Read file into buffer for storage
    const fileBuffer = fs.readFileSync(req.file.path);
    eegData.data = fileBuffer;
    
    // Save EEG data to database
    await eegData.save();
    
    // Delete temporary file
    fs.unlinkSync(req.file.path);
    
    // Return success response with EEG data details (without binary data)
    const result = eegData.toObject();
    delete result.data;
    
    res.status(201).json({
      message: 'EEG file uploaded successfully',
      eegData: result
    });
  } catch (err) {
    console.error('EEG upload error:', err.message);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/eeg/list
// @desc    Get all EEG files for the current user
// @access  Private
router.get('/list', auth, async (req, res) => {
  try {
    const eegFiles = await EEGData.find({ userId: req.user.id })
      .select('-data')
      .sort({ uploadDate: -1 });
    
    res.json(eegFiles);
  } catch (err) {
    console.error('Error fetching EEG list:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/eeg/browse
// @desc    Browse EEG files with filtering (alias for /list)
// @access  Private
router.get('/browse', auth, async (req, res) => {
  try {
    const { filterByOwner, page = 0, pageSize = 20, searchTerm } = req.query;
    
    let query = {};
    
    // Handle different filter types
    if (filterByOwner === 'OwnData' || filterByOwner === 'Mine') {
      query.userId = req.user.id;
    } else if (filterByOwner === 'All' || !filterByOwner) {
      // For regular users, show only their data
      // Admin/DepartmentHead logic would go here if implemented
      query.userId = req.user.id;
    }
    
    // Add search functionality if searchTerm is provided
    if (searchTerm) {
      query.$or = [
        { originalFilename: { $regex: searchTerm, $options: 'i' } },
        { notes: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }
    
    // Pagination
    const skip = parseInt(page) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const totalCount = await EEGData.countDocuments(query);
    const eegFiles = await EEGData.find(query)
      .select('-data')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Transform data to match frontend expectations
    const transformedData = eegFiles.map(file => ({
      id: file._id,
      filename: file.filename,
      originalFilename: file.originalFilename,
      format: file.format,
      size: file.size,
      uploadDate: file.uploadDate,
      notes: file.notes || '',
      tags: file.tags || [],
      isOwner: file.userId.toString() === req.user.id,
      accessType: 'Owner',
      permission: 'ViewDownload',
      ownerName: req.user.username || 'Unknown',
      ownerEmail: req.user.email || 'Unknown',
      ownerInstitution: 'Institution', // Could be added to user model
      adhdAnalysis: file.svm_analysis ? {
        performed: file.svm_analysis.performed || false,
        result: file.svm_analysis.result,
        confidence: file.svm_analysis.confidence
      } : undefined
    }));
    
    const response = {
      data: transformedData,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize)),
      userRole: req.user.role || 'User',
      canViewAll: req.user.role === 'admin' || req.user.role === 'departmenthead'
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error browsing EEG files:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/eeg/:id
// @desc    Get EEG data by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const eegData = await EEGData.findById(req.params.id).select('-data');
    
    if (!eegData) {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    // Check if user is authorized to access this EEG data
    if (eegData.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(eegData);
  } catch (err) {
    console.error('Error fetching EEG data:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/eeg/:id/download
// @desc    Download EEG data file
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const eegData = await EEGData.findById(req.params.id);
    
    if (!eegData) {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    // Check if user is authorized to access this EEG data
    if (eegData.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Set headers for file download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${eegData.originalFilename}"`,
      'Content-Length': eegData.data.length
    });
    
    // Send the file
    res.send(eegData.data);
  } catch (err) {
    console.error('Error downloading EEG file:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/eeg/:id/analyze
// @desc    Request ADHD analysis for an EEG file
// @access  Private
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const eegData = await EEGData.findById(req.params.id);
    
    if (!eegData) {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    // Check if user is authorized to analyze this EEG data
    if (eegData.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update EEG data to request analysis
    eegData.svm_analysis = {
      requested: true,
      performed: false,
      in_progress: false
    };
    
    await eegData.save();
    
    res.json({
      message: 'Analysis requested successfully',
      eegData: {
        ...eegData.toObject(),
        data: undefined
      }
    });
  } catch (err) {
    console.error('Error requesting analysis:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/eeg/:id
// @desc    Delete an EEG file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const eegData = await EEGData.findById(req.params.id);
    
    if (!eegData) {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    // Check if user is authorized to delete this EEG data
    if (eegData.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete the EEG data
    await eegData.remove();
    
    res.json({ message: 'EEG data deleted successfully' });
  } catch (err) {
    console.error('Error deleting EEG data:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'EEG data not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;