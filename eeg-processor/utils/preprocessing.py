# utils/preprocessing.py - Preprocess EEG data
import logging
import numpy as np
import mne
from scipy import signal

logger = logging.getLogger('eeg_processor.preprocessing')

def preprocess_eeg(raw, apply_filter=True, apply_rereferencing=True, 
                  apply_artifact_rejection=True, resample_freq=None):
    """
    Preprocess EEG data for analysis
    
    Parameters:
    raw (mne.io.Raw): MNE Raw object containing EEG data
    apply_filter (bool): Whether to apply filtering
    apply_rereferencing (bool): Whether to apply re-referencing
    apply_artifact_rejection (bool): Whether to apply artifact rejection
    resample_freq (float): Target frequency for resampling, or None to skip
    
    Returns:
    mne.io.Raw: Preprocessed MNE Raw object
    """
    # Create a copy to avoid modifying the original
    raw_processed = raw.copy()
    
    # Pick only EEG channels for processing
    picks = mne.pick_types(raw_processed.info, eeg=True, exclude='bads')
    
    # Step 1: Filtering
    if apply_filter:
        logger.info("Applying filters")
        
        # Apply notch filter (e.g., for line noise at 50 or 60 Hz)
        line_freq = raw_processed.info.get('line_freq')
        if line_freq is None:
            # Try to determine the line frequency from the country
            # Default to 50 Hz (most common)
            line_freq = 50
        
        # Apply notch filter with a width of 2 Hz
        notch_freqs = np.arange(line_freq, raw_processed.info['sfreq'] // 2, line_freq)
        if notch_freqs.size > 0:
            logger.info(f"Applying notch filter at {notch_freqs} Hz")
            raw_processed.notch_filter(notch_freqs, picks=picks)
        
        # Apply bandpass filter (typical range for EEG analysis)
        logger.info("Applying bandpass filter (0.5 - 50 Hz)")
        raw_processed.filter(l_freq=0.5, h_freq=50, picks=picks)
    
    # Step 2: Re-referencing
    if apply_rereferencing:
        logger.info("Applying re-referencing")
        # Re-reference to average reference
        raw_processed.set_eeg_reference('average', projection=True)
    
    # Step 3: Artifact rejection
    if apply_artifact_rejection:
        logger.info("Applying artifact rejection")
        
        # Create a copy for easier manipulation
        data = raw_processed.get_data(picks=picks)
        
        # Method 1: Amplitude thresholding
        # Define thresholds (in μV)
        min_threshold = -150
        max_threshold = 150
        
        # Find artifacts based on thresholds
        artifacts = np.logical_or(data < min_threshold, data > max_threshold)
        
        # Count artifacts
        artifact_channels = np.sum(artifacts, axis=1)
        artifact_times = np.sum(artifacts, axis=0)
        
        logger.info(f"Found {np.sum(artifacts)} amplitude artifacts")
        
        # Optionally, mark bad channels
        bad_channels = []
        for i, ch_name in enumerate(np.array(raw_processed.ch_names)[picks]):
            # If more than 5% of data points are artifacts in this channel
            if artifact_channels[i] > data.shape[1] * 0.05:
                bad_channels.append(ch_name)
                logger.info(f"Marking channel {ch_name} as bad")
        
        if bad_channels:
            raw_processed.info['bads'].extend(bad_channels)
        
        # Method 2: ICA-based artifact rejection (more complex)
        # This is simplified here - a full implementation would include ICA
        # fitting, component selection, and signal reconstruction
        
        # For simplicity, we'll skip full ICA implementation
    
    # Step 4: Resampling (if needed)
    if resample_freq is not None and resample_freq > 0:
        current_freq = raw_processed.info['sfreq']
        if current_freq != resample_freq:
            logger.info(f"Resampling from {current_freq} Hz to {resample_freq} Hz")
            raw_processed.resample(resample_freq)
    
    return raw_processed

def segment_eeg(raw, tmin=-0.2, tmax=0.5, event_id=None):
    """
    Segment continuous EEG data into epochs
    
    Parameters:
    raw (mne.io.Raw): MNE Raw object containing EEG data
    tmin (float): Start time before event in seconds
    tmax (float): End time after event in seconds
    event_id (dict): Dictionary mapping event names to event codes
    
    Returns:
    mne.Epochs: Segmented EEG data
    """
    if event_id is None:
        # If no specific events provided, create artificial events
        # This is useful for resting-state data with no events
        
        # Create events at regular intervals (e.g., every 1 second)
        events = mne.make_fixed_length_events(raw, id=1, duration=1.0)
        event_id = {'segment': 1}
    else:
        # Try to find events from the data
        events = mne.find_events(raw, stim_channel='STI 014')
        
        if len(events) == 0:
            # No events found, use fixed length as fallback
            logger.warning("No events found in the data. Using fixed length events.")
            events = mne.make_fixed_length_events(raw, id=1, duration=1.0)
            event_id = {'segment': 1}
    
    # Create epochs
    epochs = mne.Epochs(
        raw,
        events,
        event_id,
        tmin=tmin,
        tmax=tmax,
        baseline=(tmin, 0),
        preload=True,
        reject_by_annotation=True
    )
    
    logger.info(f"Created {len(epochs)} epochs from {len(events)} events")
    
    return epochs

def detect_bad_channels(raw, z_threshold=3.0):
    """
    Detect bad channels based on statistical measures
    
    Parameters:
    raw (mne.io.Raw): MNE Raw object containing EEG data
    z_threshold (float): Z-score threshold for bad channel detection
    
    Returns:
    list: List of bad channel names
    """
    # Get EEG data
    picks = mne.pick_types(raw.info, eeg=True, exclude=[])
    data = raw.get_data(picks=picks)
    
    # Calculate statistics
    channel_std = np.std(data, axis=1)
    channel_range = np.ptp(data, axis=1)
    
    # Z-score for standard deviation
    std_z = (channel_std - np.mean(channel_std)) / np.std(channel_std)
    
    # Z-score for range
    range_z = (channel_range - np.mean(channel_range)) / np.std(channel_range)
    
    # Find channels with extreme z-scores
    bad_std = np.abs(std_z) > z_threshold
    bad_range = np.abs(range_z) > z_threshold
    
    # Combine criteria
    bad_channels = np.logical_or(bad_std, bad_range)
    
    # Get channel names
    bad_channel_names = [raw.ch_names[picks[i]] for i in np.where(bad_channels)[0]]
    
    logger.info(f"Detected {len(bad_channel_names)} bad channels: {bad_channel_names}")
    
    return bad_channel_names

def interpolate_bad_channels(raw, bad_channels=None):
    """
    Interpolate bad channels using spherical spline interpolation
    
    Parameters:
    raw (mne.io.Raw): MNE Raw object containing EEG data
    bad_channels (list): List of bad channel names, or None to use raw.info['bads']
    
    Returns:
    mne.io.Raw: MNE Raw object with interpolated channels
    """
    # Make a copy of the raw data
    raw_interp = raw.copy()
    
    # Use provided bad channels or those already marked in the data
    if bad_channels is not None:
        raw_interp.info['bads'] = bad_channels
    
    # Only interpolate if there are bad channels
    if len(raw_interp.info['bads']) > 0:
        # Need at least 3 good EEG channels for interpolation
        good_eeg_picks = mne.pick_types(raw_interp.info, eeg=True, exclude='bads')
        
        if len(good_eeg_picks) >= 3:
            logger.info(f"Interpolating {len(raw_interp.info['bads'])} bad channels")
            raw_interp.interpolate_bads(reset_bads=True)
        else:
            logger.warning("Not enough good EEG channels for interpolation")
    else:
        logger.info("No bad channels to interpolate")
    
    return raw_interp