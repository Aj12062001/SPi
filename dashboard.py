import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from face_recognition_module import recognize_face # Importing your module

# --- PAGE CONFIG ---
st.set_page_config(page_title="SPi | Insider Threat System", layout="wide", page_icon="🛡️")

# --- DATA LOADING ---
@st.cache_data
def load_project_data():
    # Loading your specific output file
    df = pd.read_csv("user_features_with_anomaly.csv")
    # Mapping your -1/1 to readable labels
    df['Status'] = df['anomaly'].map({1: 'Normal', -1: 'ANOMALY'})
    # Creating a Risk Score for the UI (0-100)
    df['Risk_Score_UI'] = (df['risk_score'] * 100).round(2)
    return df

df = load_project_data()

# --- SIDEBAR NAVIGATION ---
st.sidebar.title("🛡️ SPi Control Center")
st.sidebar.markdown("AI-Based Insider Threat Detection")
menu = st.sidebar.radio("Navigate", ["System Overview", "User Investigation", "Live Face Recognition"])

# --- TAB 1: SYSTEM OVERVIEW ---
if menu == "System Overview":
    st.title("System-Wide Threat Assessment")
    
    col1, col2, col3 = st.columns(3)
    total_users = len(df)
    anomalies_count = len(df[df['anomaly'] == -1])
    
    col1.metric("Total Users Monitored", total_users)
    col2.metric("Anomalies Detected", anomalies_count, delta=f"{anomalies_count} critical", delta_color="inverse")
    col3.metric("System Health", "Active", "Secure")

    st.subheader("Global Risk Distribution")
    fig = px.scatter(df, x="login_count", y="web_activity_count", 
                     color="Status", size="Risk_Score_UI",
                     hover_data=['user'], color_discrete_map={'Normal': 'blue', 'ANOMALY': 'red'})
    st.plotly_chart(fig, use_container_width=True)

# --- TAB 2: USER INVESTIGATION ---
elif menu == "User Investigation":
    st.title("User Behavior Audit")
    target_user = st.selectbox("Select User to Audit", df['user'].unique())
    user_data = df[df['user'] == target_user].iloc[0]

    c1, c2 = st.columns([1, 2])
    
    with c1:
        # Gauge Chart for Risk Score
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = user_data['Risk_Score_UI'],
            title = {'text': "Risk Magnitude"},
            gauge = {'axis': {'range': [0, 100]},
                     'bar': {'color': "red" if user_data['anomaly'] == -1 else "green"}}
        ))
        st.plotly_chart(fig_gauge, use_container_width=True)
        
        if user_data['anomaly'] == -1:
            st.error(f"🚨 CRITICAL: {target_user} flagged for {user_data['alert_level']} behavior.")

    with c2:
        st.write("### Behavioral Metrics")
        metrics = {
            "Login Frequency": user_data['login_count'],
            "After-Hours Access": user_data['after_hours_login'],
            "USB Usage": user_data['usb_usage_count'],
            "Web Activity": user_data['web_activity_count']
        }
        st.json(metrics)

# --- TAB 3: LIVE FACE RECOGNITION ---
elif menu == "Live Face Recognition":
    st.title("Physical Access Monitoring")
    st.info("Simulating Restricted Zone Camera Feed...")
    
    img_file = st.camera_input("Scan Face for Access")
    
    if img_file:
        # Calling your face_recognition_module.py logic
        recognized_users = recognize_face(img_file)
        if recognized_users[0] != "Unknown":
            st.success(f"✅ Access Granted: {recognized_users[0]}")
            st.balloons()
        else:
            st.error("❌ Access Denied: Unauthorized Personnel Detected")