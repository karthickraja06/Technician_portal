import numpy as np
import pandas as pd
from numpy.fft import rfft, rfftfreq

# Feature extraction functions
def std(data):
    '''Standard Deviation features'''
    data = np.asarray(data)
    stdev = pd.DataFrame(np.std(data, axis=1))
    return stdev


def mean(data):
    '''Mean features'''
    data = np.asarray(data)
    M = pd.DataFrame(np.mean(data, axis=1))
    return M


def pp(data):
    '''Peak-to-Peak features'''
    data = np.asarray(data)
    PP = pd.DataFrame(np.max(data, axis=1) - np.min(data, axis=1))
    return PP


def Variance(data):
    '''Variance features'''
    data = np.asarray(data)
    Var = pd.DataFrame(np.var(data, axis=1))
    return Var


def rms(data):
    '''RMS features'''
    data = np.asarray(data)
    Rms = pd.DataFrame(np.sqrt(np.mean(data**2, axis=1)))
    return Rms


def Shapef(data):
    '''Shape factor features'''
    data = np.asarray(data)
    shapef = pd.DataFrame(rms(data)/Ab_mean(data))
    return shapef


def Impulsef(data):
    '''Impulse factor features'''
    data = np.asarray(data)
    impulse = pd.DataFrame(np.max(data)/Ab_mean(data))
    return impulse


def crestf(data):
    '''Crest factor features'''
    data = np.asarray(data)
    crest = pd.DataFrame(np.max(data)/rms(data))
    return crest


def kurtosis(data):
    '''Kurtosis features'''
    data = pd.DataFrame(data)
    kurt = data.kurt(axis=1)
    return kurt


def skew(data):
    '''Skewness features'''
    data = pd.DataFrame(data)
    skw = data.skew(axis=1)
    return skw


# Helper functions to calculate features
def Ab_mean(data):
    data = np.asarray(data)
    Abm = pd.DataFrame(np.mean(np.absolute(data), axis=1))
    return Abm


def SQRT_AMPL(data):
    data = np.asarray(data)
    SQRTA = pd.DataFrame((np.mean(np.sqrt(np.absolute(data, axis=1))))**2)
    return SQRTA


def clearancef(data):
    data = np.asarray(data)
    clrf = pd.DataFrame(np.max(data, axis=1)/SQRT_AMPL(data))
    return clrf

# FFT function
def FFT(data):
    """Perform FFT and truncate frequencies."""
    data = np.asarray(data)  # Ensure input is 2D
    n = len(data)
    dt = 1 / 20000
    data = rfft(data) * dt
    freq = rfftfreq(n, dt)
    data = abs(data).T
    data = (np.delete(data, range(500 * 5, len(data)), axis=0)).T
    return (data)

# Normalize function
def NormalizeData(data,data_merged):
    """Normalize data to range 0-1."""
    data_max = np.max(data_merged)
    data_min = np.min(data_merged)
    return (data - np.min(data_min)) / (np.max(data_max) - np.min(data_min))
# Main function to process input array and return features
def extract_feature(data):
    """
    Process input array and return an array of features.
    Input: data (numpy array) with columns [time, x, y, z]
    Output: features (numpy array) of length 27
    """
    x = pd.DataFrame(data[:, 1]).T.dropna(axis=1)
    y = pd.DataFrame(data[:, 2]).T.dropna(axis=1)
    z = pd.DataFrame(data[:, 3]).T.dropna(axis=1)
    # Extract x, y, z columns
    # x, y, z = data[:, 1], data[:, 2], data[:, 3]

    # Perform FFT
    fft_x, fft_y, fft_z = FFT(x), FFT(y), FFT(z)

    data_mergerd = np.concatenate((fft_x, fft_y, fft_z))  # Merge x, y, z data
    # Normalize FFT data
    fft_x, fft_y, fft_z = NormalizeData(fft_x,data_mergerd), NormalizeData(fft_y,data_mergerd), NormalizeData(fft_z,data_mergerd)

    # # Ensure FFT data is 2D
    # fft_x = np.atleast_2d(fft_x)
    # fft_y = np.atleast_2d(fft_y)
    # fft_z = np.atleast_2d(fft_z)

    # Extract features for each axis
    # feature_funcs = [mean, std, Shapef, rms, Impulsef, pp, kurtosis, crestf, skew]
    # features = np.concatenate
    #     np.concatenate([func(fft_x), func(fft_y), func(fft_z)]) for func in feature_funcs
    # ])
    shapef_1x = Shapef(fft_x)
    shapef_1y = Shapef(fft_y)
    shapef_1z = Shapef(fft_z)

    shapef_1 = pd.concat([shapef_1x, shapef_1y, shapef_1z],
                     axis=1, ignore_index=True)
    
    rms_1x = rms(fft_x)
    rms_1y = rms(fft_y)
    rms_1z = rms(fft_z)

    rms_1 = pd.concat([rms_1x, rms_1y, rms_1z], axis=1, ignore_index=True)

    Impulsef_1x = Impulsef(fft_x)
    Impulsef_1y = Impulsef(fft_y)
    Impulsef_1z = Impulsef(fft_z)

    Impulsef_1 = pd.concat(
    [Impulsef_1x, Impulsef_1y, Impulsef_1z], axis=1, ignore_index=True)

    pp_1x = pp(fft_x)
    pp_1y = pp(fft_y)
    pp_1z = pp(fft_z)

    pp_1 = pd.concat([pp_1x, pp_1y, pp_1z], axis=1, ignore_index=True)

    kurtosis_1x = kurtosis(fft_x)
    kurtosis_1y = kurtosis(fft_y)
    kurtosis_1z = kurtosis(fft_z)

    kurtosis_1 = pd.concat(
    [kurtosis_1x, kurtosis_1y, kurtosis_1z], axis=1, ignore_index=True)

    crestf_1x = crestf(fft_x)
    crestf_1y = crestf(fft_y)
    crestf_1z = crestf(fft_z)

    crestf_1 = pd.concat([crestf_1x, crestf_1y, crestf_1z],
                     axis=1, ignore_index=True)
    
    mean_1x = mean(fft_x)
    mean_1y = mean(fft_y)
    mean_1z = mean(fft_z)

    mean_1 = pd.concat([mean_1x, mean_1y, mean_1z], axis=1, ignore_index=True)

    std_1x = std(fft_x)
    std_1y = std(fft_y)
    std_1z = std(fft_z)

    std_1 = pd.concat([std_1x, std_1y, std_1z], axis=1, ignore_index=True)


    skew_1x = skew(fft_x)
    skew_1y = skew(fft_y)
    skew_1z = skew(fft_z)

    skew_1 = pd.concat([skew_1x, skew_1y, skew_1z], axis=1, ignore_index=True)

    x_1 = pd.concat([mean_1, std_1, shapef_1, rms_1, Impulsef_1,
                pp_1, kurtosis_1, crestf_1, skew_1], axis=1, ignore_index=True)
    
    features = pd.concat([x_1], axis=0, ignore_index=True)
    features = np.asarray(x)
    features = pd.DataFrame(features)
    
    print(f"Features shape: {features.shape}")
     
    # Convert numpy.float64 to Python float
    return (features, {
        "x": {
            'rms': float(features.iloc[3]),
            'kurtosis': float(features.iloc[6]),
            'pp': float(features.iloc[5]),
            'crestf': float(features.iloc[7])
        },
        "y": {
            'rms': float(features.iloc[3 + 9]),
            'kurtosis': float(features.iloc[6 + 9]),
            'pp': float(features.iloc[5 + 9]),
            'crestf': float(features.iloc[7 + 9])
        },
        "z": {
            'rms': float(features.iloc[3 + 18]),
            'kurtosis': float(features.iloc[6 + 18]),
            'pp': float(features.iloc[5 + 18]),
            'crestf': float(features.iloc[7 + 18])
        }
    })
