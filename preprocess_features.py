import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# -------------------------------
# 1. LOAD GENERATED FEATURES
# -------------------------------
user_features = pd.read_csv("user_features.csv")

# Inspect data
print("First 5 rows:\n", user_features.head())
print("\nInfo:\n", user_features.info())
print("\nSummary stats:\n", user_features.describe())

# -------------------------------
# 2. SCALE NUMERIC FEATURES
# -------------------------------
scaler = MinMaxScaler()
numeric_cols = ['login_count','after_hours_login','unique_pc_count','usb_usage_count','web_activity_count']

user_features_scaled = user_features.copy()
user_features_scaled[numeric_cols] = scaler.fit_transform(user_features[numeric_cols])

# -------------------------------
# 3. SAVE PROCESSED FEATURES
# -------------------------------
user_features_scaled.to_csv("user_features_scaled.csv", index=False)
print("\nScaled features saved to 'user_features_scaled.csv'")
print("Features merged successfully")