

import pandas as pd
from sklearn.ensemble import IsolationForest

# -------------------------------
# 1. LOAD SCALED FEATURES
# -------------------------------
features = pd.read_csv("user_features_scaled.csv")

# Drop 'user' column for modeling
X = features.drop(columns=['user'])

# -------------------------------
# 2. TRAIN ISOLATION FOREST
# -------------------------------
# contamination=0.05 assumes ~5% anomalies; adjust as needed
clf = IsolationForest(contamination=0.05, random_state=42)
clf.fit(X)

# -------------------------------
# 3. PREDICT ANOMALIES
# -------------------------------
# -1 = anomaly, 1 = normal
features['anomaly'] = clf.predict(X)

# Optional: get anomaly scores (higher = more normal)
features['anomaly_score'] = clf.decision_function(X)

# -------------------------------
# 4. COMPUTE RISK SCORES AND ALERTS
# -------------------------------
from sklearn.preprocessing import MinMaxScaler

scaler_score = MinMaxScaler()
features['normalized_score'] = scaler_score.fit_transform(features[['anomaly_score']])
features['risk_score'] = 1 - features['normalized_score']  # higher risk_score means higher risk

def categorize_alert(risk):
    if risk > 0.7:
        return 'Critical'
    elif risk > 0.4:
        return 'Suspicious'
    else:
        return 'Normal'

features['alert_level'] = features['risk_score'].apply(categorize_alert)

# -------------------------------
# 5. SAVE RESULTS
# -------------------------------
features.to_csv("user_features_with_anomaly.csv", index=False)

print("Anomaly detection completed.")
print("Results saved to 'user_features_with_anomaly.csv'")

# -------------------------------
# 6. OPTIONAL: QUICK STATS
# -------------------------------
num_anomalies = (features['anomaly'] == -1).sum()
print(f"Number of detected anomalies: {num_anomalies} out of {len(features)} users")

alert_counts = features['alert_level'].value_counts()
print("Alert levels:")
print(alert_counts)
