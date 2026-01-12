import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# -------------------------------
# 1. LOAD ANOMALY RESULTS
# -------------------------------
df = pd.read_csv("user_features_with_anomaly.csv")
print("Loaded user_features_with_anomaly.csv")
print(f"Total users: {len(df)}")

# -------------------------------
# 2. FILTER ANOMALIES
# -------------------------------
anomalies = df[df['anomaly'] == -1]
print(f"Number of anomalies detected: {len(anomalies)}")

# Save anomalies to CSV
anomalies.to_csv("anomalous_users.csv", index=False)
print("Saved anomalies to 'anomalous_users.csv'")

# -------------------------------
# 3. DASHBOARD PLOTS
# -------------------------------
features = ['login_count', 'after_hours_login', 'unique_pc_count', 'usb_usage_count', 'web_activity_count']

# 3a. Scatter plots: all features vs web_activity_count
num_features = len(features)-1
fig, axes = plt.subplots(1, num_features, figsize=(6*num_features,5))

for i, feat in enumerate(features[:-1]):
    axes[i].scatter(df[feat], df['web_activity_count'],
                    c=df['anomaly'].map({1: 'blue', -1: 'red'}),
                    alpha=0.6)
    axes[i].set_xlabel(feat)
    axes[i].set_ylabel('web_activity_count')
    axes[i].set_title(f'{feat} vs web_activity_count (red=anomaly)')

plt.tight_layout()
plt.savefig("anomalies_scatter_dashboard.png")
plt.show()

# 3b. Correlation heatmap
plt.figure(figsize=(8,6))
corr = df[features].corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
plt.title("Feature Correlation Heatmap")
plt.savefig("anomalies_correlation_heatmap.png")
plt.show()

# -------------------------------
# 4. Top 10 most suspicious users
# -------------------------------
top_anomalies = df.nsmallest(10, 'anomaly_score')
print("\nTop 10 most suspicious users:")
print(top_anomalies[['user','anomaly_score'] + features])