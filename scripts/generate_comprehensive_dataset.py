#!/usr/bin/env python3
"""
Generate a comprehensive 10,000-row insider threat dataset with realistic metrics
for risk management analysis and ML model training.
"""

import csv
import random
from pathlib import Path
from datetime import datetime, timedelta

def generate_dataset(num_records=10000, output_file='data/dummy_risk_10k.csv'):
    """Generate comprehensive employee risk dataset."""
    
    random.seed(42)
    
    # Enhanced headers for comprehensive analysis
    headers = [
        'user',
        'employee_name',
        'department',
        'job_title',
        'date',
        'login_count',
        'night_logins',
        'unique_pcs',
        'usb_count',
        'file_activity_count',
        'file_deleted',
        'file_copied',
        'file_accessed',
        'emails_sent',
        'external_emails',
        'email_attachments',
        'http_requests',
        'unique_urls',
        'cctv_anomalies',
        'access_card_anomalies',
        'behavioral_score',
        'anomaly_label',
        'risk_score'
    ]
    
    departments = ['Engineering', 'Finance', 'Operations', 'Marketing', 'HR', 'Legal', 'Sales', 'IT', 'Security', 'Executive']
    job_titles = ['Senior Developer', 'Analyst', 'Manager', 'Coordinator', 'Specialist', 'Director', 'Consultant', 'Officer', 'Lead', 'Associate']
    first_names = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'James', 'Lisa', 'Robert', 'Maria']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    base_date = datetime.now()
    
    with output_path.open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for i in range(1, num_records + 1):
            user = f"USR{i:05d}"
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            employee_name = f"{first_name} {last_name}"
            department = random.choice(departments)
            job_title = random.choice(job_titles)
            
            # Distribute dates across last 30 days
            days_back = i % 30
            record_date = (base_date - timedelta(days=days_back)).strftime('%Y-%m-%d')
            
            # Realistic activity metrics
            login_count = random.randint(40, 250)
            night_logins = random.randint(0, max(0, int(login_count * 0.08)))
            unique_pcs = random.randint(1, 8)
            
            # USB and file activity
            usb_count = random.randint(0, 150)
            file_activity = random.randint(20, 1200)
            file_deleted = random.randint(0, max(0, int(file_activity * 0.15)))
            file_copied = random.randint(0, max(0, int(file_activity * 0.20)))
            file_accessed = file_activity - file_deleted - file_copied
            
            # Email metrics
            emails_sent = random.randint(5, 200)
            external_emails = random.randint(0, max(0, int(emails_sent * 0.40)))
            email_attachments = random.randint(0, max(0, int(emails_sent * 0.30)))
            
            # HTTP and web activity
            http_requests = random.randint(50, 2000)
            unique_urls = random.randint(20, min(http_requests, 500))
            
            # Physical/camera anomalies
            cctv_anomalies = random.randint(0, 15)
            access_card_anomalies = random.randint(0, 8)
            
            # Behavioral score (0-100)
            base_behavior = random.uniform(20, 95)
            behavior_noise = random.uniform(-15, 20)
            behavioral_score = round(max(0, min(100, base_behavior + behavior_noise)), 2)
            
            # Anomaly label: 1 = normal (75%), -1 = anomalous (25%)
            anomaly_label = -1 if random.random() < 0.25 else 1
            
            # Comprehensive risk score calculation
            file_risk = (file_deleted * 0.5 + file_copied * 0.4) * 0.15
            usb_risk = usb_count * 0.1
            night_risk = night_logins * 1.5
            email_risk = external_emails * 0.3
            url_risk = (unique_urls / max(1, http_requests)) * 20 if http_requests > 0 else 0
            physical_risk = (cctv_anomalies + access_card_anomalies) * 2
            behavior_penalty = (100 - behavioral_score) * 0.2
            anomaly_boost = 15 if anomaly_label == -1 else 0
            
            risk_score = round(max(0, min(100, 
                file_risk + usb_risk + night_risk + email_risk + 
                url_risk + physical_risk + behavior_penalty + anomaly_boost
            )), 2)
            
            writer.writerow([
                user,
                employee_name,
                department,
                job_title,
                record_date,
                login_count,
                night_logins,
                unique_pcs,
                usb_count,
                file_activity,
                file_deleted,
                file_copied,
                file_accessed,
                emails_sent,
                external_emails,
                email_attachments,
                http_requests,
                unique_urls,
                cctv_anomalies,
                access_card_anomalies,
                behavioral_score,
                anomaly_label,
                risk_score
            ])
    
    print(f"✓ Generated {output_path} with {num_records:,} comprehensive employee records")

if __name__ == '__main__':
    generate_dataset(10000)
