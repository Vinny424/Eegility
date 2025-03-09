# utils/feature_extraction.py - Extract features from EEG for ADHD detection
import numpy as np
from scipy import signal
import mne

def extract_features_for_adhd(raw):
    """
    Extract features from EEG data for ADHD detection
    Features are based on power spectral density in different frequency bands

    Parameters:
    raw (mne.io.Raw): MNE Raw object containing EEG data

    Returns:
    dict: Dictionary of features
    """
    # Define frequency bands
    bands = {
        'delta': (0.5, 4),
        'theta': (4, 8),
        'alpha': (8, 13),
        'beta': (13, 30),
        'gamma': (30, 50)
    }
    
    # Filter EEG channels only
    picks = mne.pick_types(raw.info, eeg=True, exclude='bads')
    
    # Calculate power spectral density
    psd, freqs = mne.time_frequency.psd_welch(
        raw, 
        fmin=0.5, 
        fmax=50, 
        picks=picks, 
        n_fft=int(raw.info['sfreq'] * 2),  # 2-second window
        n_overlap=int(raw.info['sfreq']),  # 50% overlap
        n_per_seg=int(raw.info['sfreq'] * 2)
    )
    
    # Extract band powers
    features = {}
    
    # For each channel
    for ch_idx, ch_name in enumerate(np.array(raw.ch_names)[picks]):
        ch_psd = psd[ch_idx]
        
        # For each frequency band
        for band_name, (fmin, fmax) in bands.items():
            # Find frequencies in the band
            freq_idx = np.logical_and(freqs >= fmin, freqs <= fmax)
            
            # Calculate band power
            band_power = np.mean(ch_psd[freq_idx])
            
            # Store as feature
            features[f'{ch_name}_{band_name}'] = band_power
    
    # Calculate common ADHD-relevant features
    
    # 1. Theta/Beta ratio (a common biomarker in ADHD research)
    for ch_idx, ch_name in enumerate(np.array(raw.ch_names)[picks]):
        theta_power = features.get(f'{ch_name}_theta', 0)
        beta_power = features.get(f'{ch_name}_beta', 0)
        
        if beta_power > 0:  # Avoid division by zero
            features[f'{ch_name}_theta_beta_ratio'] = theta_power / beta_power
    
    # 2. Frontal asymmetry (relevant for emotional regulation in ADHD)
    # Find frontal channels
    frontal_channels = [ch for ch in np.array(raw.ch_names)[picks] 
                      if ch.startswith('F') or ch.startswith('Fp')]
    
    # Calculate alpha asymmetry if frontal channels are available
    if len(frontal_channels) >= 2:
        left_frontal = [ch for ch in frontal_channels if '3' in ch or '7' in ch]
        right_frontal = [ch for ch in frontal_channels if '4' in ch or '8' in ch]
        
        if left_frontal and right_frontal:
            # Average alpha power in left and right frontal regions
            left_alpha = np.mean([features.get(f'{ch}_alpha', 0) for ch in left_frontal])
            right_alpha = np.mean([features.get(f'{ch}_alpha', 0) for ch in right_frontal])
            
            # Alpha asymmetry score
            if left_alpha > 0 and right_alpha > 0:  # Avoid log of zero/negative
                features['frontal_alpha_asymmetry'] = np.log(right_alpha) - np.log(left_alpha)
    
    # 3. Global band powers (averaged across channels)
    for band_name in bands:
        band_features = [v for k, v in features.items() if f'_{band_name}' in k]
        if band_features:
            features[f'global_{band_name}'] = np.mean(band_features)
    
    # 4. Global theta/beta ratio
    global_theta = features.get('global_theta', 0)
    global_beta = features.get('global_beta', 0)
    
    if global_beta > 0:  # Avoid division by zero
        features['global_theta_beta_ratio'] = global_theta / global_beta
    
    # 5. Region-specific features
    # Define regions
    regions = {
        'frontal': [ch for ch in np.array(raw.ch_names)[picks] 
                  if ch.startswith('F') or ch.startswith('Fp')],
        'central': [ch for ch in np.array(raw.ch_names)[picks] 
                  if ch.startswith('C')],
        'temporal': [ch for ch in np.array(raw.ch_names)[picks] 
                   if ch.startswith('T')],
        'parietal': [ch for ch in np.array(raw.ch_names)[picks] 
                   if ch.startswith('P')],
        'occipital': [ch for ch in np.array(raw.ch_names)[picks] 
                    if ch.startswith('O')]
    }
    
    # Calculate regional band powers
    for region_name, region_channels in regions.items():
        if not region_channels:
            continue
            
        for band_name in bands:
            band_powers = []
            for ch in region_channels:
                power = features.get(f'{ch}_{band_name}', None)
                if power is not None:
                    band_powers.append(power)
            
            if band_powers:
                features[f'{region_name}_{band_name}'] = np.mean(band_powers)
        
        # Regional theta/beta ratio
        region_theta = features.get(f'{region_name}_theta', 0)
        region_beta = features.get(f'{region_name}_beta', 0)
        
        if region_beta > 0:  # Avoid division by zero
            features[f'{region_name}_theta_beta_ratio'] = region_theta / region_beta
    
    # 6. Coherence features (connectivity between regions)
    # This would typically be calculated from raw time series data
    # For simplicity, we'll skip this in the example
    
    # 7. Feature normalization
    # Normalize global band powers by total power
    total_power = sum([v for k, v in features.items() 
                     if k.startswith('global_') and not k.endswith('_ratio')])
    
    if total_power > 0:
        for band_name in bands:
            key = f'global_{band_name}'
            if key in features:
                features[f'{key}_norm'] = features[key] / total_power
    
    return features

def select_adhd_relevant_features(features, top_n=20):
    """
    Select the most relevant features for ADHD detection
    
    Parameters:
    features (dict): Dictionary of all extracted features
    top_n (int): Number of top features to select
    
    Returns:
    dict: Dictionary of selected features
    """
    # Define the most relevant features for ADHD
    # Based on literature, the theta/beta ratio in frontal channels is important
    relevant_features = [
        'global_theta_beta_ratio',
        'frontal_theta_beta_ratio',
        'central_theta_beta_ratio',
        'frontal_alpha_asymmetry'
    ]
    
    # Add frontal and central theta/beta ratios for individual channels
    relevant_features.extend([k for k in features.keys() 
                            if ('_theta_beta_ratio' in k) and 
                               (k.startswith('F') or k.startswith('Fp') or k.startswith('C'))])
    
    # Add normalized global band powers
    relevant_features.extend([k for k in features.keys() if k.endswith('_norm')])
    
    # Filter to only include features that exist in the input
    selected_features = {k: features[k] for k in relevant_features if k in features}
    
    # If we have too many, take the top N by value (assuming higher values are more relevant)
    if len(selected_features) > top_n:
        selected_features = dict(sorted(selected_features.items(), 
                                        key=lambda x: abs(x[1]), 
                                        reverse=True)[:top_n])
    
    return selected_features