import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# -------------------------------
# PAGE CONFIG
# -------------------------------
st.set_page_config(
    page_title="Anomaly Detection Dashboard",
    page_icon="🔍",
    layout="wide"
)

# -------------------------------
# TITLE
# -------------------------------
st.title("🔍 User Behavior Anomaly Detection")
st.markdown(
    "Isolation Forest–based anomaly detection on user activity logs "
    "(login, USB usage, web activity)."
)

# -------------------------------
# LOAD DATA
# -------------------------------
@st.cache_data
def load_data():
    return pd.read_csv("user_features_with_anomaly.csv")

df = load_data()

# -------------------------------
# SIDEBAR FILTERS
# -------------------------------
st.sidebar.header("Filters")
view_option = st.sidebar.selectbox(
    "Show Users",
    ["All Users", "Anomalies Only", "Normal Users Only"]
)

if view_option == "Anomalies Only":
    filtered_df = df[df["anomaly"] == -1]
elif view_option == "Normal Users Only":
    filtered_df = df[df["anomaly"] == 1]
else:
    filtered_df = df

# -------------------------------
# METRICS
# -------------------------------
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Total Users", len(df))
with col2:
    st.metric("Anomalies Detected", len(df[df["anomaly"] == -1]))
with col3:
    st.metric("Normal Users", len(df[df["anomaly"] == 1]))

# -------------------------------
# DATA TABLE
# -------------------------------
st.subheader("User Feature Data")
st.dataframe(filtered_df, use_container_width=True)

# -------------------------------
# FEATURE LIST
# -------------------------------
features = [
    "login_count",
    "after_hours_login",
    "unique_pc_count",
    "usb_usage_count",
    "web_activity_count"
]

# -------------------------------
# CORRELATION HEATMAP
# -------------------------------
st.subheader("Feature Correlation Heatmap")
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(df[features].corr(), annot=True, cmap="coolwarm", fmt=".2f", ax=ax)
st.pyplot(fig)

# -------------------------------
# SCATTER PLOT
# -------------------------------
st.subheader("Anomaly Visualization")
x_feature = st.selectbox("Select X-axis feature", features[:-1])

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(
    df[x_feature],
    df["web_activity_count"],
    c=df["anomaly"].map({1: "blue", -1: "red"}),
    alpha=0.6
)
ax.set_xlabel(x_feature)
ax.set_ylabel("web_activity_count")
ax.set_title("Red = Anomaly | Blue = Normal")
st.pyplot(fig)

# -------------------------------
# ANOMALIES SECTION
# -------------------------------
st.subheader("Detected Anomalous Users")
anomalies = df[df["anomaly"] == -1]
st.dataframe(anomalies, use_container_width=True)

# -------------------------------
# DOWNLOAD BUTTON
# -------------------------------
st.download_button(
    label="⬇ Download Anomalous Users CSV",
    data=anomalies.to_csv(index=False),
    file_name="anomalous_users.csv",
    mime="text/csv"
)
