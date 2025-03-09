# utils/eeg_loader.py - Load various EEG file formats
import os
import logging
import mne

logger = logging.getLogger('eeg_processor.loader')

def load_eeg_file(file_path):
    """
    Load EEG data from various formats supported by MNE-Python
    
    Parameters:
    file_path (str): Path to the EEG file
    
    Returns:
    mne.io.Raw: MNE Raw object containing EEG data
    
    Raises:
    ValueError: If the file format is not supported or there's an error loading the file
    """
    if not os.path.exists(file_path):
        raise ValueError(f"File does not exist: {file_path}")
    
    file_ext = os.path.splitext(file_path)[1].lower()
    
    try:
        logger.info(f"Loading EEG file: {file_path} with extension {file_ext}")
        
        # Load based on file extension
        if file_ext in ['.edf', '.bdf']:
            logger.info("Loading as EDF/BDF format")
            raw = mne.io.read_raw_edf(file_path, preload=True)
        
        elif file_ext == '.cnt':
            logger.info("Loading as CNT format")
            raw = mne.io.read_raw_cnt(file_path, preload=True)
        
        elif file_ext in ['.vhdr', '.vmrk', '.eeg']:
            logger.info("Loading as BrainVision format")
            # For BrainVision format, we need the .vhdr file
            if file_ext == '.vhdr':
                header_file = file_path
            elif file_ext == '.vmrk':
                # Guess header file from marker file
                header_file = file_path.replace('.vmrk', '.vhdr')
            else:  # .eeg
                # Guess header file from data file
                header_file = file_path.replace('.eeg', '.vhdr')
            
            if not os.path.exists(header_file):
                raise ValueError(f"BrainVision header file not found: {header_file}")
            
            raw = mne.io.read_raw_brainvision(header_file, preload=True)
        
        elif file_ext == '.set':
            logger.info("Loading as EEGLAB format")
            raw = mne.io.read_raw_eeglab(file_path, preload=True)
        
        elif file_ext == '.fif':
            logger.info("Loading as FIF format")
            raw = mne.io.read_raw_fif(file_path, preload=True)
        
        elif file_ext == '.npy':
            logger.info("Loading as NumPy array")
            import numpy as np
            data = np.load(file_path)
            
            # Create MNE Raw object from NumPy array
            # Assume data shape is (n_channels, n_times)
            n_channels, n_times = data.shape
            
            # Create info structure
            info = mne.create_info(
                ch_names=[f"ch{i}" for i in range(n_channels)],
                sfreq=250,  # Default sampling rate, should be provided for real data
                ch_types=['eeg'] * n_channels
            )
            
            raw = mne.io.RawArray(data, info)
        
        else:
            # Try to auto-detect format
            logger.info("Trying to auto-detect format")
            raw = mne.io.read_raw(file_path, preload=True)
            
        logger.info(f"Successfully loaded EEG with {len(raw.ch_names)} channels and {raw.n_times} time points")
        
        return raw
    
    except Exception as e:
        logger.error(f"Error loading EEG file: {str(e)}")
        raise ValueError(f"Error loading EEG file: {str(e)}")

def extract_bids_info_from_filename(filename):
    """
    Extract BIDS information from filename
    
    Parameters:
    filename (str): BIDS-compatible filename
    
    Returns:
    dict: Dictionary containing BIDS entities
    """
    # Strip any directory paths and file extension
    base_filename = os.path.basename(filename)
    base_filename = os.path.splitext(base_filename)[0]
    
    # Split by underscores
    parts = base_filename.split('_')
    
    # Initialize BIDS entities
    bids_info = {
        'sub': None,
        'ses': None,
        'task': None,
        'run': None
    }
    
    # Extract BIDS entities
    for part in parts:
        if part.startswith('sub-'):
            bids_info['sub'] = part[4:]
        elif part.startswith('ses-'):
            bids_info['ses'] = part[4:]
        elif part.startswith('task-'):
            bids_info['task'] = part[5:]
        elif part.startswith('run-'):
            bids_info['run'] = part[4:]
    
    return bids_info