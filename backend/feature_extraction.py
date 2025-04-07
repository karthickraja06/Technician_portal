import numpy as np
import pandas as pd
from numpy.fft import rfft

# Feature extraction functions
def std(data): return np.std(data, axis=1)
def mean(data): return np.mean(data, axis=1)
def pp(data): return (np.max(data, axis=1) - np.min(data, axis=1))
def rms(data): return np.sqrt(np.mean(data**2, axis=1))
def Shapef(data): return rms(data) / Ab_mean(data)
def Impulsef(data): return np.max(data, axis=1) / Ab_mean(data)
def crestf(data): return np.max(data, axis=1) / rms(data)
def kurtosis(data): return pd.DataFrame(data).kurt(axis=1).values
def skew(data): return pd.DataFrame(data).skew(axis=1).values
def Ab_mean(data): return np.mean(np.abs(data), axis=1)

# FFT function
def FFT(data):
    """Perform FFT and truncate frequencies."""
    data = np.atleast_2d(data)  # Ensure input is 2D
    dt = 1 / 20000
    data = rfft(data) * dt
    data = abs(data).T
    data = (np.delete(data, range(500 * 5, len(data)), axis=0)).T
    return data

# Normalize function
def NormalizeData(data):
    """Normalize data to range 0-1."""
    return (data - np.min(data)) / (np.max(data) - np.min(data))

# Main function to process input array and return features
def extract_feature(data):
    """
    Process input array and return an array of features.
    Input: data (numpy array) with columns [time, x, y, z]
    Output: features (numpy array) of length 27
    """
    # Extract x, y, z columns
    x, y, z = data[:, 1], data[:, 2], data[:, 3]

    # Perform FFT
    fft_x, fft_y, fft_z = FFT(x), FFT(y), FFT(z)

    # Normalize FFT data
    fft_x, fft_y, fft_z = NormalizeData(fft_x), NormalizeData(fft_y), NormalizeData(fft_z)

    # Extract features for each axis
    feature_funcs = [mean, std, Shapef, rms, Impulsef, pp, kurtosis, crestf, skew]
    # Extract features in the correct order
    features = np.concatenate([
        np.concatenate([func(fft_x), func(fft_y), func(fft_z)]) for func in feature_funcs
    ])
    

    return (features, {
        "x": {
            'rms': features[3],
            'kurtosis': features[6],
            'pp': features[5],
            'crestf': features[7]
        },
        "y": {
            'rms': features[3 + 9],
            'kurtosis': features[6 + 9],
            'pp': features[5 + 9],
            'crestf': features[7 + 9]
        },
        "z": {
            'rms': features[3 + 18],
            'kurtosis': features[6 + 18],
            'pp': features[5 + 18],
            'crestf': features[7 + 18]
        }
    })
