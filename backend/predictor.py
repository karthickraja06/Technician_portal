# api/predictor.py
from typing import Dict
import numpy as np
from joblib import load

# Load pre-trained models 
svm = load(r"backend\models\svm_model.pkl")
knn = load(r"backend\models\knn_model.pkl")
gnb = load(r"backend\models\gnb_model.pkl")

# Mapping from numeric labels to string labels
LABELS = {
    0: 'normal',
    1: 'misalignment',
    2: 'unbalance',
    3: 'bearing_fault'
}

def predict_fault(features: np.ndarray) -> Dict:
    """Predict using all models + voting"""
    # Get predictions from models
    pred_svm = svm.predict([features])[0]
    pred_knn = knn.predict([features])[0]
    pred_gnb = gnb.predict([features])[0]

    # Convert numeric predictions to string labels
    pred_svm_label = LABELS[pred_svm]
    pred_knn_label = LABELS[pred_knn]
    pred_gnb_label = LABELS[pred_gnb]

    # Count votes
    votes = {
        'normal': 0,
        'unbalance': 0,
        'misalignment': 0,
        'bearing_fault': 0
    }
    votes[pred_svm_label] += 1
    votes[pred_knn_label] += 1
    votes[pred_gnb_label] += 1

    # Decision rule
    max_votes = max(votes.values())
    if max_votes >= 2:  # At least 2 models agree
        fault = max(votes, key=votes.get)
        confidence = 'high'
    else:
        fault = 'suspicious'
        confidence = 'low'

    return {
        'fault': fault,
        'confidence': confidence,
        'svm': pred_svm_label,
        'knn': pred_knn_label,
        'gnb': pred_gnb_label
    }