// services/eegProcessing.js - EEG file processing service
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

/**
 * Extract metadata from an EEG file
 * @param {string} filePath - Path to the EEG file
 * @returns {Promise<Object>} - Extracted metadata
 */
const extractMetadata = async (filePath) => {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Simple metadata extraction based on file size and extension
    const fileStats = fs.statSync(filePath);
    
    // Default metadata
    let metadata = {
      channels: 0,
      sampleRate: 0,
      duration: 0
    };
    
    // For simple implementation, we use file size to estimate duration
    // In a real app, we'd use proper EEG libraries (e.g., MNE through Python)
    const averageSamplingRate = 250; // Hz
    const averageChannels = 32;
    const bytesPerSample = 4; // 4 bytes per float32 sample
    
    // Rough estimate of duration (in seconds)
    const estimatedDuration = fileStats.size / (averageSamplingRate * averageChannels * bytesPerSample);
    
    metadata.channels = averageChannels;
    metadata.sampleRate = averageSamplingRate;
    metadata.duration = Math.round(estimatedDuration);
    
    // For a real app, we'd extract actual metadata from the file using 
    // EEG-specific libraries or call a Python script that uses MNE
    
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      channels: 0,
      sampleRate: 0,
      duration: 0
    };
  }
};

/**
 * Process an EEG file (format conversion, validation, etc.)
 * @param {string} filePath - Path to the EEG file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing results
 */
const processEEGFile = async (filePath, options = {}) => {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const metadata = await extractMetadata(filePath);
    
    // Validate BIDS compatibility if requested
    let bidsValid = false;
    if (options.validateBids) {
      bidsValid = validateBidsCompatibility(filePath);
    }
    
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    return {
      metadata,
      bidsValid,
      fileContent
    };
  } catch (error) {
    console.error('Error processing EEG file:', error);
    throw new Error(`Failed to process EEG file: ${error.message}`);
  }
};

/**
 * Validate BIDS compatibility of a file
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file is BIDS compatible
 */
const validateBidsCompatibility = (filePath) => {
  // Extract filename without extension
  const filename = path.basename(filePath, path.extname(filePath));
  
  // Check if filename follows BIDS convention
  // Example: sub-01_ses-01_task-rest_eeg.edf
  const bidsPattern = /^sub-[\w]+(_ses-[\w]+)?(_task-[\w]+)?(_run-[\d]+)?(_eeg)?$/;
  return bidsPattern.test(filename);
};

/**
 * Request ADHD analysis from the Python service
 * @param {string} eegId - ID of the EEG data in MongoDB
 * @returns {Promise<Object>} - Analysis results
 */
const requestADHDAnalysis = async (eegId) => {
  try {
    // Create a request file that the Python service will detect
    const requestDir = process.env.DATA_DIR || './data';
    
    // Ensure directory exists
    if (!fs.existsSync(requestDir)) {
      fs.mkdirSync(requestDir, { recursive: true });
    }
    
    // Create empty request file
    const requestPath = path.join(requestDir, `${eegId}.request`);
    fs.writeFileSync(requestPath, '');
    
    return {
      success: true,
      message: 'Analysis request submitted'
    };
  } catch (error) {
    console.error('Error requesting ADHD analysis:', error);
    throw new Error(`Failed to request ADHD analysis: ${error.message}`);
  }
};

module.exports = {
  extractMetadata,
  processEEGFile,
  validateBidsCompatibility,
  requestADHDAnalysis
};