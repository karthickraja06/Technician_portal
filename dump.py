import numpy as np
from scipy.fft import fft
from scipy.stats import kurtosis, skew

def extract_statistical_features(signal):
    """Extract statistical features from a signal"""
    mean = np.mean(signal)
    rms = np.sqrt(np.mean(signal**2))
    peak_to_peak = np.max(signal) - np.min(signal)
    std = np.std(signal)
    shape_factor = rms / np.mean(np.abs(signal))
    crest_factor = np.max(np.abs(signal)) / rms
    impulse_factor = np.max(np.abs(signal)) / np.mean(np.abs(signal))
    kurt = kurtosis(signal)
    skewness = skew(signal)
    
    return [mean, rms, peak_to_peak, std, shape_factor, crest_factor, impulse_factor, kurt, skewness]

def extract_frequency_features(signal, fs=20000):
    """Extract frequency domain features"""
    n = len(signal)
    freq_spectrum = np.abs(fft(signal))[:n//2]
    freqs = np.fft.fftfreq(n, 1/fs)[:n//2]
    dominant_freq = freqs[np.argmax(freq_spectrum)]
    mean_freq = np.average(freqs, weights=freq_spectrum)
    freq_rms = np.sqrt(np.mean(freq_spectrum**2))
    
    return [dominant_freq, mean_freq, freq_rms]

def extract_features_from_array(data, fs=20000, window_size=1000, step=500):
    """Extract 27 features from [time, x, y, z] vibration data array"""
    time, x, y, z = data[:, 0], data[:, 1], data[:, 2], data[:, 3]
    
    all_features = []
    for i in range(0, len(time) - window_size, step):
        x_window = x[i:i+window_size]
        y_window = y[i:i+window_size]
        z_window = z[i:i+window_size]
        
        features = []
        for signal in [x_window, y_window, z_window]:
            features.extend(extract_statistical_features(signal))
            features.extend(extract_frequency_features(signal, fs))
        
        all_features.append(features)
    
    return np.array(all_features)
