# EEGility

**A BIDS-compatible EEG data management and analysis platform with ADHD detection capabilities.**

Developed by Vincent Hartline

## Overview

EEGility is a comprehensive, containerized web application for managing, storing, and analyzing EEG data following the Brain Imaging Data Structure (BIDS) format. This platform provides seamless integration between data storage, metadata management, and advanced analysis features for neuroscientific research.

## Key Features

- **User Authentication**: Secure login system with JWT authentication
- **EEG Data Management**: Upload, download, and browse EEG recordings
- **Metadata Storage**: Comprehensive metadata tracking with BIDS compatibility
- **ADHD Analysis**: Support Vector Machine (SVM) based classification for ADHD detection
- **Containerized Deployment**: Easy deployment with Docker and Docker Compose
- **Modern UI**: User-friendly interface built with React and Material-UI

## Supported EEG Formats

- European Data Format (EDF/EDF+)
- BioSemi Data Format (BDF)
- BrainVision format (VHDR/VMRK/EEG)
- EEGLab format (SET)
- FIFF format (FIF)
- Neuroscan (CNT)
- NumPy arrays (NPY)

## System Architecture

EEGility follows a microservices architecture:

- **MongoDB**: NoSQL database for flexible EEG data storage
- **Node.js/Express**: Backend REST API service
- **React**: Frontend user interface
- **Python/MNE**: EEG processing and analysis service
- **Docker**: Containerization and orchestration

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vinny424/eegility.git
   cd eegility
   ```

2. Start the containerized application:
   ```bash
   docker-compose up -d
   ```

3. Access the application in your browser:
   ```
   http://localhost:8080
   ```

4. Login with default credentials:
   - Username: `user@example.com`
   - Password: `user123`

## Development Setup

If you want to contribute or run the application in development mode:

1. Clone the repository:
   ```bash
   git clone https://github.com/vinny424/eegility.git
   cd eegility
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Start MongoDB and the EEG processor:
   ```bash
   docker-compose up -d mongodb eeg-processor
   ```

5. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

6. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

## Usage Guide

### Uploading EEG Data

1. Log in to the application
2. Navigate to the "Upload" page
3. Drag & drop or select an EEG file
4. Fill in subject information and metadata
5. Click "Upload" to process and store the data

### Running ADHD Analysis

1. Find the EEG recording you want to analyze in the Dashboard
2. Click on the "Analysis" icon
3. Review the file details and click "Run ADHD Analysis"
4. View the analysis results including:
   - ADHD classification (ADHD vs. non-ADHD)
   - Classification confidence
   - Key EEG features (theta/beta ratio, etc.)
   - Visualization of results

### Managing User Profile

1. Click on your profile icon in the top-right corner
2. Select "Profile" to view and update your information
3. Update your personal details or change your password

## Project Structure

```
eegility/
├── .env                          # Environment variables
├── docker-compose.yml            # Docker Compose configuration
├── mongo-init.js                 # MongoDB initialization script
│
├── backend/                      # Node.js Express backend
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB schema models
│   ├── routes/                   # API route handlers
│   └── services/                 # Business logic services
│
├── frontend/                     # React frontend
│   ├── src/                      # React source code
│   │   ├── components/           # Reusable components
│   │   ├── contexts/             # Context API providers
│   │   └── pages/                # App pages
│   └── nginx/                    # Nginx configuration
│
└── eeg-processor/                # Python EEG processing service
    ├── models/                   # ML model files
    └── utils/                    # Utility functions
```

## Troubleshooting

### Common Issues

#### Missing Node Modules
If you encounter errors related to missing modules like `multer`:

```
Error: Cannot find module 'multer'
```

Fix by rebuilding the Docker containers:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

#### Port Conflicts
EEGility uses the following ports:
- MongoDB: 27018
- Backend API: 5002
- Frontend: 8080

If you have conflicts, modify the port mappings in `docker-compose.yml`.

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Material-UI, Chart.js
- **Analysis**: Python, MNE, scikit-learn
- **DevOps**: Docker, Docker Compose, Nginx

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created by Vincent Hartline

## Acknowledgments

- The BIDS community for standardizing neuroimaging data formats
- MNE-Python for excellent EEG processing capabilities 
- MongoDB for flexible document database system