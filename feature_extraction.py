import pandas as pd

# -------------------------------
# 1. LOAD CERT DATASET FILES
# -------------------------------

# Update paths if required
logon = pd.read_csv("data/r1/logon.csv")
device = pd.read_csv("data/r1/device.csv")
http = pd.read_csv("data/r1/http.csv", header=None, names=['id','date','user','pc','url'])

print("Datasets loaded successfully")

# -------------------------------
# 2. LOGIN-BASED FEATURE EXTRACTION
# -------------------------------

# Convert date column to datetime
logon['date'] = pd.to_datetime(logon['date'])

# Extract hour from timestamp
logon['hour'] = logon['date'].dt.hour

# Aggregate login features per user
login_features = logon.groupby('user').agg(
    login_count=('user', 'count'),
    after_hours_login=('hour', lambda x: ((x < 9) | (x > 18)).sum()),
    unique_pc_count=('pc', 'nunique')
).reset_index()

print("Login features extracted")

# -------------------------------
# 3. USB / DEVICE FEATURE EXTRACTION
# -------------------------------

usb_features = device.groupby('user').agg(
    usb_usage_count=('activity', 'count')
).reset_index()

print("USB features extracted")

# -------------------------------
# 4. WEB ACTIVITY FEATURE EXTRACTION
# -------------------------------

web_features = http.groupby('user').agg(
    web_activity_count=('url', 'count')
).reset_index()

print("Web activity features extracted")

# -------------------------------
# 5. MERGE ALL FEATURES
# -------------------------------

user_features = login_features \
    .merge(usb_features, on='user', how='left') \
    .merge(web_features, on='user', how='left')

# Replace missing values with 0
user_features.fillna(0, inplace=True)

print("All features merged")

# -------------------------------
# 6. SAVE FINAL FEATURE FILE
# -------------------------------

user_features.to_csv("user_features.csv", index=False)

print("Feature extraction completed")
print("Output file saved as user_features.csv")
