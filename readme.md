# EEG BIDS Database with MongoDB

A containerized web application for managing EEG data following the BIDS (Brain Imaging Data Structure) format, with support for ADHD analysis using SVM.

## Overview

This project provides a complete solution for uploading, storing, and analyzing EEG data in various formats compatible with the BIDS specification. The system includes:

- MongoDB database for efficient storage of EEG data and metadata
- RESTful API for data management
- Web-based frontend with authentication
- Support for uploading various EEG file formats
- Machine learning algorithms for ADHD detection

## Features

- **User Authentication**: Secure login system with JWT
- **EEG Data Management**: Upload, download, and browse EEG recordings
- **BIDS Compatibility**: Support for BIDS-compatible EEG data formats
- **Containerized Deployment**: Easy deployment with Docker
- **ADHD Analysis**: SVM-based classification for ADHD detection
- **Responsive UI**: Modern web interface built with React and Material-UI

## Supported EEG Formats

- European Data Format (EDF/EDF+)
- BioSemi Data Format (BDF)
- BrainVision format (VHDR/VMRK/EEG)
- EEGLab format (SET)
- FIFF format (FIF)
- And more...

## System Architecture

The system is built with a microservices architecture using:

- **MongoDB**: Database for EEG data storage
- **Node.js/Express**: Backend API service
- **React**: Frontend user interface
- **Python/MNE**: EEG processing and analysis
- **Docker**: Containerization and orchestration

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/eeg-bids-mongodb.git
   cd eeg-bids-mongodb
   ```

2. Configure the environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. Start the containers:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   ```
   http://localhost
   ```

## Usage

### Uploading EEG Data

1. Log in to the application
2. Navigate to the Upload page
3. Select an EEG file and provide subject information
4. Click "Upload" to process and store the data

### Running ADHD Analysis

1. Navigate to the Dashboard
2. Find the EEG recording you want to analyze
3. Click on the "Run SVM Analysis" button
4. View the results and visualizations

## Development

### Project Structure

```
eeg-bids-mongodb/
├── backend/                # Node.js Express backend
├── frontend/               # React frontend
└── eeg-processor/          # Python EEG processing service
```

### Running in Development Mode

For development, you can run services individually:

```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development
cd frontend
npm install
npm start

# EEG processor development
cd eeg-processor
pip install -r requirements.txt
python processor.py
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The BIDS community for standardizing neuroimaging data formats
- MNE-Python for EEG processing capabilities
- MongoDB for the flexible document database