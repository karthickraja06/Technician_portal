# Script to train

# importation
from numpy.fft import rfft
import numpy as np
import os
import pandas as pd
import glob

data_path = '/data/VBL-VA001/'

totalFiles = 0
totalDir = 0


# Collecting number data
dir_path1 = data_path + '/normal/'
print('Total data Normal :', len([entry for entry in os.listdir(
    dir_path1) if os.path.isfile(os.path.join(dir_path1, entry))]))
dir_path2 = data_path + '/misalignment/'
print('Total data misalignment :', len([entry for entry in os.listdir(
    dir_path2) if os.path.isfile(os.path.join(dir_path2, entry))]))
dir_path3 = data_path + '/unbalance'
print('Total data unbalance :', len([entry for entry in os.listdir(
    dir_path3) if os.path.isfile(os.path.join(dir_path3, entry))]))
dir_path4 = data_path + '/bearing'
print('Total data bearing fault:', len([entry for entry in os.listdir(
    dir_path4) if os.path.isfile(os.path.join(dir_path4, entry))]))

# Collecting file names
normal_file_names = glob.glob(data_path + '/normal/*.csv')
imnormal_misalignment = glob.glob(data_path + '/misalignment/*.csv')
imnormal_unbalance = glob.glob(data_path + '/unbalance/*.csv')
imnormal_bearing = glob.glob(data_path + '/bearing/*.csv')

all_file_names = [normal_file_names, imnormal_misalignment, imnormal_unbalance, imnormal_bearing]

def FFT(data):
    '''FFT process, take real values only'''
    data = np.asarray(data)
    dt = 1/20000  # time increment in each data
    data = rfft(data)*dt
    data = abs(data).T
    data = (np.delete(data, range(500*5,len(data)), axis=0)).T
    return (data)

# Feature Extraction function
def std(data):
    '''Standard Deviation features'''
    return pd.DataFrame(np.std(np.asarray(data), axis=1))


def mean(data):
    '''Mean features'''
    data = np.asarray(data)
    return pd.DataFrame(np.mean(data, axis=1))


def pp(data):
    '''Peak-to-Peak features'''
    data = np.asarray(data)
    return pd.DataFrame(np.max(data, axis=1) - np.min(data, axis=1))


def Variance(data):
    '''Variance features'''
    data = np.asarray(data)
    return pd.DataFrame(np.var(data, axis=1))


def rms(data):
    '''RMS features'''
    data = np.asarray(data)
    return pd.DataFrame(np.sqrt(np.mean(data**2, axis=1)))


def Shapef(data):
    '''Shape factor features'''
    data = np.asarray(data)
    return pd.DataFrame(rms(data)/Ab_mean(data))


def Impulsef(data):
    '''Impulse factor features'''
    data = np.asarray(data)
    return pd.DataFrame(np.max(data)/Ab_mean(data))


def crestf(data):
    '''Crest factor features'''
    data = np.asarray(data)
    return pd.DataFrame(np.max(data)/rms(data))


def kurtosis(data):
    '''Kurtosis features'''
    data = pd.DataFrame(data)
    return data.kurt(axis=1)


def skew(data):
    '''Skewness features'''
    data = pd.DataFrame(data)
    return data.skew(axis=1)


# Helper functions to calculate features
def Ab_mean(data):
    data = np.asarray(data)
    return pd.DataFrame(np.mean(np.absolute(data), axis=1))


def SQRT_AMPL(data):
    data = np.asarray(data)
    return pd.DataFrame((np.mean(np.sqrt(np.absolute(data, axis=1))))**2)


def clearancef(data):
    data = np.asarray(data)
    return pd.DataFrame(np.max(data, axis=1)/SQRT_AMPL(data))


# Extract features from X, Y, Z axis
def data_concat(file_names,col):
    datax = pd.DataFrame()
    for fx in file_names:
        dfx = pd.read_csv(fx, usecols=[col], header=None)  # read the csv file
        datax = pd.concat([datax, dfx], axis=1, ignore_index=True)
    return datax

all_data = []

for file_names in all_file_names:
    for i in range(3):
        data = FFT(data_concat(file_names, i).T.dropna(axis=1))
        all_data.append(data)

# merge data
data_merged = np.concatenate(all_data)


# normalize data
def NormalizeData(data):  # Normalisasi (0-1)
    data_max = np.max(data_merged)
    data_min = np.min(data_merged)
    return (data - np.min(data_min)) / (np.max(data_max) - np.min(data_min))

feature = []
for i in range(len(all_file_names)):
    sub = []
    for j in range(3):
        normal = NormalizeData((i*3)+j)
        Shapef(normal)

    all_data.append(NormalizeData(i))


# # Feature Extraction
# # shape factor
# shapef_1x = Shapef(fft_1x)
# shapef_1y = Shapef(fft_1y)
# shapef_1z = Shapef(fft_1z)
# shapef_2x = Shapef(fft_2x)
# shapef_2y = Shapef(fft_2y)
# shapef_2z = Shapef(fft_2z)
# shapef_3x = Shapef(fft_3x)
# shapef_3y = Shapef(fft_3y)
# shapef_3z = Shapef(fft_3z)
# shapef_4x = Shapef(fft_4x)
# shapef_4y = Shapef(fft_4y)
# shapef_4z = Shapef(fft_4z)

# shapef_1 = pd.concat([shapef_1x, shapef_1y, shapef_1z],
#                      axis=1, ignore_index=True)
# shapef_2 = pd.concat([shapef_2x, shapef_2y, shapef_2z],
#                      axis=1, ignore_index=True)
# shapef_3 = pd.concat([shapef_3x, shapef_3y, shapef_3z],
#                      axis=1, ignore_index=True)
# shapef_4 = pd.concat([shapef_4x, shapef_4y, shapef_4z],
#                      axis=1, ignore_index=True)

# # root mean square
# rms_1x = rms(fft_1x)
# rms_1y = rms(fft_1y)
# rms_1z = rms(fft_1z)
# rms_2x = rms(fft_2x)
# rms_2y = rms(fft_2y)
# rms_2z = rms(fft_2z)
# rms_3x = rms(fft_3x)
# rms_3y = rms(fft_3y)
# rms_3z = rms(fft_3z)
# rms_4x = rms(fft_4x)
# rms_4y = rms(fft_4y)
# rms_4z = rms(fft_4z)

# rms_1 = pd.concat([rms_1x, rms_1y, rms_1z], axis=1, ignore_index=True)
# rms_2 = pd.concat([rms_2x, rms_2y, rms_2z], axis=1, ignore_index=True)
# rms_3 = pd.concat([rms_3x, rms_3y, rms_3z], axis=1, ignore_index=True)
# rms_4 = pd.concat([rms_4x, rms_4y, rms_4z], axis=1, ignore_index=True)

# # impulse factor
# Impulsef_1x = Impulsef(fft_1x)
# Impulsef_1y = Impulsef(fft_1y)
# Impulsef_1z = Impulsef(fft_1z)
# Impulsef_2x = Impulsef(fft_2x)
# Impulsef_2y = Impulsef(fft_2y)
# Impulsef_2z = Impulsef(fft_2z)
# Impulsef_3x = Impulsef(fft_3x)
# Impulsef_3y = Impulsef(fft_3y)
# Impulsef_3z = Impulsef(fft_3z)
# Impulsef_4x = Impulsef(fft_4x)
# Impulsef_4y = Impulsef(fft_4y)
# Impulsef_4z = Impulsef(fft_4z)

# Impulsef_1 = pd.concat(
#     [Impulsef_1x, Impulsef_1y, Impulsef_1z], axis=1, ignore_index=True)
# Impulsef_2 = pd.concat(
#     [Impulsef_2x, Impulsef_2y, Impulsef_2z], axis=1, ignore_index=True)
# Impulsef_3 = pd.concat(
#     [Impulsef_3x, Impulsef_3y, Impulsef_3z], axis=1, ignore_index=True)
# Impulsef_4 = pd.concat(
#     [Impulsef_4x, Impulsef_4y, Impulsef_4z], axis=1, ignore_index=True)

# # peak factor
# pp_1x = pp(fft_1x)
# pp_1y = pp(fft_1y)
# pp_1z = pp(fft_1z)
# pp_2x = pp(fft_2x)
# pp_2y = pp(fft_2y)
# pp_2z = pp(fft_2z)
# pp_3x = pp(fft_3x)
# pp_3y = pp(fft_3y)
# pp_3z = pp(fft_3z)
# pp_4x = pp(fft_4x)
# pp_4y = pp(fft_4y)
# pp_4z = pp(fft_4z)

# pp_1 = pd.concat([pp_1x, pp_1y, pp_1z], axis=1, ignore_index=True)
# pp_2 = pd.concat([pp_2x, pp_2y, pp_2z], axis=1, ignore_index=True)
# pp_3 = pd.concat([pp_3x, pp_3y, pp_3z], axis=1, ignore_index=True)
# pp_4 = pd.concat([pp_4x, pp_4y, pp_4z], axis=1, ignore_index=True)

# # kurtosis factor
# # kurtosis_1x = kurtosis(fft_1x)
# # kurtosis_1y = kurtosis(fft_1y)
# # kurtosis_1z = kurtosis(fft_1z)
# # kurtosis_2x = kurtosis(fft_2x)
# # kurtosis_2y = kurtosis(fft_2y)
# # kurtosis_2z = kurtosis(fft_2z)
# # kurtosis_3x = kurtosis(fft_3x)
# # kurtosis_3y = kurtosis(fft_3y)
# # kurtosis_3z = kurtosis(fft_3z)
# # kurtosis_4x = kurtosis(fft_4x)
# # kurtosis_4y = kurtosis(fft_4y)
# # kurtosis_4z = kurtosis(fft_4z)

# kurtosis_1 = pd.concat(
#     [kurtosis_1x, kurtosis_1y, kurtosis_1z], axis=1, ignore_index=True)
# kurtosis_2 = pd.concat(
#     [kurtosis_2x, kurtosis_2y, kurtosis_2z], axis=1, ignore_index=True)
# kurtosis_3 = pd.concat(
#     [kurtosis_3x, kurtosis_3y, kurtosis_3z], axis=1, ignore_index=True)
# kurtosis_4 = pd.concat(
#     [kurtosis_4x, kurtosis_4y, kurtosis_4z], axis=1, ignore_index=True)

# # crest factor
# crestf_1x = crestf(fft_1x)
# crestf_1y = crestf(fft_1y)
# crestf_1z = crestf(fft_1z)
# crestf_2x = crestf(fft_2x)
# crestf_2y = crestf(fft_2y)
# crestf_2z = crestf(fft_2z)
# crestf_3x = crestf(fft_3x)
# crestf_3y = crestf(fft_3y)
# crestf_3z = crestf(fft_3z)
# crestf_4x = crestf(fft_4x)
# crestf_4y = crestf(fft_4y)
# crestf_4z = crestf(fft_4z)

# crestf_1 = pd.concat([crestf_1x, crestf_1y, crestf_1z],
#                      axis=1, ignore_index=True)
# crestf_2 = pd.concat([crestf_2x, crestf_2y, crestf_2z],
#                      axis=1, ignore_index=True)
# crestf_3 = pd.concat([crestf_3x, crestf_3y, crestf_3z],
#                      axis=1, ignore_index=True)
# crestf_4 = pd.concat([crestf_4x, crestf_4y, crestf_4z],
#                      axis=1, ignore_index=True)

# # mean
# mean_1x = mean(fft_1x)
# mean_1y = mean(fft_1y)
# mean_1z = mean(fft_1z)
# mean_2x = mean(fft_2x)
# mean_2y = mean(fft_2y)
# mean_2z = mean(fft_2z)
# mean_3x = mean(fft_3x)
# mean_3y = mean(fft_3y)
# mean_3z = mean(fft_3z)
# mean_4x = mean(fft_4x)
# mean_4y = mean(fft_4y)
# mean_4z = mean(fft_4z)

# mean_1 = pd.concat([mean_1x, mean_1y, mean_1z], axis=1, ignore_index=True)
# mean_2 = pd.concat([mean_2x, mean_2y, mean_2z], axis=1, ignore_index=True)
# mean_3 = pd.concat([mean_3x, mean_3y, mean_3z], axis=1, ignore_index=True)
# mean_4 = pd.concat([mean_4x, mean_4y, mean_4z], axis=1, ignore_index=True)

# # std
# std_1x = std(fft_1x)
# std_1y = std(fft_1y)
# std_1z = std(fft_1z)
# std_2x = std(fft_2x)
# std_2y = std(fft_2y)
# std_2z = std(fft_2z)
# std_3x = std(fft_3x)
# std_3y = std(fft_3y)
# std_3z = std(fft_3z)
# std_4x = std(fft_4x)
# std_4y = std(fft_4y)
# std_4z = std(fft_4z)

# std_1 = pd.concat([std_1x, std_1y, std_1z], axis=1, ignore_index=True)
# std_2 = pd.concat([std_2x, std_2y, std_2z], axis=1, ignore_index=True)
# std_3 = pd.concat([std_3x, std_3y, std_3z], axis=1, ignore_index=True)
# std_4 = pd.concat([std_4x, std_4y, std_4z], axis=1, ignore_index=True)

# # skew
# skew_1x = skew(fft_1x)
# skew_1y = skew(fft_1y)
# skew_1z = skew(fft_1z)
# skew_2x = skew(fft_2x)
# skew_2y = skew(fft_2y)
# skew_2z = skew(fft_2z)
# skew_3x = skew(fft_3x)
# skew_3y = skew(fft_3y)
# skew_3z = skew(fft_3z)
# skew_4x = skew(fft_4x)
# skew_4y = skew(fft_4y)
# skew_4z = skew(fft_4z)

# skew_1 = pd.concat([skew_1x, skew_1y, skew_1z], axis=1, ignore_index=True)
# skew_2 = pd.concat([skew_2x, skew_2y, skew_2z], axis=1, ignore_index=True)
# skew_3 = pd.concat([skew_3x, skew_3y, skew_3z], axis=1, ignore_index=True)
# skew_4 = pd.concat([skew_4x, skew_4y, skew_4z], axis=1, ignore_index=True)

# x_1 = pd.concat([mean_1, std_1, shapef_1, rms_1, Impulsef_1,
#                 pp_1, kurtosis_1, crestf_1, skew_1], axis=1, ignore_index=True)
# x_2 = pd.concat([mean_2, std_2, shapef_2, rms_2, Impulsef_2,
#                 pp_2, kurtosis_2, crestf_2, skew_2], axis=1, ignore_index=True)
# x_3 = pd.concat([mean_3, std_3, shapef_3, rms_3, Impulsef_3,
#                 pp_3, kurtosis_3, crestf_3, skew_3], axis=1, ignore_index=True)
# x_4 = pd.concat([mean_4, std_4, shapef_4, rms_4, Impulsef_4,
#                 pp_4, kurtosis_4, crestf_4, skew_4], axis=1, ignore_index=True)
# x = pd.concat([x_1, x_2, x_3, x_4], axis=0, ignore_index=True)
# x = np.asarray(x)
# print(f"Shape of feature: {x.shape}")

# # simpan data hasil ekstraksi fitur fft, will be very big, about 2GB
# fft_x = pd.DataFrame(x).to_csv(
#     'data/feature_VBL-VA001.csv', index=None, header=False)

# # Membuat label

# y_1 = np.full((int(len(x_1)), 1), 0)
# y_2 = np.full((int(len(x_2)), 1), 1)
# y_3 = np.full((int(len(x_3)), 1), 2)
# y_4 = np.full((int(len(x_4)), 1), 3)
# y = np.concatenate((y_1, y_2, y_3, y_4), axis=None)
# #y = pd.DataFrame(y)
# print(f"Shape of labels: {y.shape}")

# # simpan label
# y_label = pd.DataFrame(y).to_csv(
#     'data/label_VBL-VA001.csv', index=None, header=False)
