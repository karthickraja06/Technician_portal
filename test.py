# filepath: d:\karthick\FYP\project\VBL-VA001-master\summa\test.py
import pandas as pd
from joblib import load

# Load the feature file
feature_data = pd.read_csv("data/feature_VBL-VA001.csv", header=None)
label = pd.read_csv("data/label_VBL-VA001.csv", header=None)

# Loop through each row and predict
model = load("backend/models/svm_model.pkl")  # Replace with the correct model file

for index, row in feature_data.iterrows():
    # Select the first 27 features for the current row
    single_row_features = row.values.reshape(1, -1)  # Convert to NumPy array and reshape
    # Make a prediction for the single row
    prediction = model.predict(single_row_features)  # Pass the reshaped array
    if label.iloc[index].values[0] == prediction[0]:  # Compare with the correct label
        print(f"Prediction for row {index}: {prediction[0]} - Correct")
    else:
        print(f"Prediction for row {index}: {prediction[0]} - Incorrect")