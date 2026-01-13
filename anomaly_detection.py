

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
# 4. SAVE RESULTS
# -------------------------------
features.to_csv("user_features_with_anomaly.csv", index=False)

print("Anomaly detection completed.")
print("Results saved to 'user_features_with_anomaly.csv'")

# -------------------------------
# 5. OPTIONAL: QUICK STATS
# -------------------------------
num_anomalies = (features['anomaly'] == -1).sum()
print(f"Number of detected anomalies: {num_anomalies} out of {len(features)} users")
