#!/usr/bin/env python3
"""
Generate specialized CCTV detection dataset with emp1 (female, critical) and emp2 (male)
with conditional critical risk based on authorized face database.
"""

import csv
import json
import random
from datetime import datetime, timedelta
import math

# Configuration
FILE_OUTPUT = 'data/cctv_employee_data.csv'
HIGH_RISK_COUNT = 10
MEDIUM_RISK_COUNT = 50
LOW_RISK_COUNT = 939  # Total 1000

# Database names
DATABASES = ['FINANCE_DB', 'HR_DB', 'AUDIT_DB', 'CRM_DB']
SYSTEMS = ['FileServer_01', 'DataWarehouse', 'ERP_DB', 'SharePoint', 'CRM_DB', 'Finance_DB', 'HR_DB']
FILE_OPERATIONS = ['open', 'copy', 'delete', 'download', 'upload', 'edit']
FILES = [
    'customer_export.csv', 'payroll_q4.xlsx', 'security_audit.json',
    'production_dump.sql', 'confidential_plan.docx', 'backup_manifest.xml',
    'hr_candidates.zip', 'legal_contract.pdf', 'roadmap_2026.pptx',
    'infra_access_keys.txt'
]

def generate_file_operations(count=60):
    """Generate file operation details with timestamps and sensitivity flags"""
    operations = []
    base_date = datetime(2026, 2, 23)
    
    for i in range(count):
        timestamp = base_date - timedelta(hours=random.randint(1, 48), minutes=random.randint(0, 59))
        op = {
            "file_name": random.choice(FILES),
            "operation": random.choice(FILE_OPERATIONS),
            "system": random.choice(SYSTEMS),
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "is_sensitive": random.random() < 0.3,
            "file_size": random.randint(100000, 12000000)
        }
        operations.append(op)
    
    return json.dumps(operations)

def generate_employee(emp_id, name, department, job_title, gender, risk_level):
    """Generate single employee record"""
    
    # Risk scoring parameters based on level
    if risk_level == 'critical':
        risk_score = random.uniform(93, 100)
        file_ops = random.randint(150, 250)
        sensitive_files = random.randint(20, 40)
        night_logins = random.randint(8, 20)
        usb_count = random.randint(15, 40)
        external_emails = random.randint(30, 60)
        db_query_count = random.randint(500, 2000)
        db_write_ops = random.randint(150, 500)
    elif risk_level == 'high':
        risk_score = random.uniform(70, 92)
        file_ops = random.randint(80, 150)
        sensitive_files = random.randint(10, 25)
        night_logins = random.randint(4, 10)
        usb_count = random.randint(8, 20)
        external_emails = random.randint(15, 35)
        db_query_count = random.randint(200, 800)
        db_write_ops = random.randint(50, 200)
    else:  # low/medium
        risk_score = random.uniform(10, 65) if risk_level == 'low' else random.uniform(40, 69)
        file_ops = random.randint(20, 80)
        sensitive_files = random.randint(0, 10)
        night_logins = random.randint(0, 3)
        usb_count = random.randint(0, 8)
        external_emails = random.randint(2, 15)
        db_query_count = random.randint(20, 300)
        db_write_ops = random.randint(5, 100)
    
    login_count = random.randint(30, 120)
    logoff_count = login_count - random.randint(0, 5)
    session_duration_total = random.randint(400, 1600)
    session_duration_avg = session_duration_total / login_count
    
    file_opened = random.randint(int(file_ops * 0.3), int(file_ops * 0.5))
    file_copied = random.randint(int(file_ops * 0.1), int(file_ops * 0.25))
    file_deleted = random.randint(int(file_ops * 0.05), int(file_ops * 0.2))
    file_downloaded = random.randint(int(file_ops * 0.1), int(file_ops * 0.25))
    file_uploaded = random.randint(int(file_ops * 0.05), int(file_ops * 0.15))
    file_edited = random.randint(int(file_ops * 0.05), int(file_ops * 0.15))
    
    database_session_duration = random.randint(30, 600)
    database_read_ops = int(db_query_count * 0.6)
    
    unique_pcs = random.randint(1, 5)
    http_requests = random.randint(50, 500)
    unique_urls = random.randint(10, 100)
    
    cctv_anomalies = random.randint(0, 5) if risk_level == 'critical' else random.randint(0, 2)
    access_card_anomalies = random.randint(0, 3) if risk_level in ['critical', 'high'] else random.randint(0, 1)
    
    behavioral_score = random.uniform(20, 50) if risk_level == 'critical' else random.uniform(10, 40)
    
    # Personality traits (Big Five)
    openness = random.randint(1, 100)
    conscientiousness = random.randint(1, 100) if risk_level != 'critical' else random.randint(1, 50)
    extraversion = random.randint(1, 100)
    agreeableness = random.randint(1, 100) if risk_level != 'critical' else random.randint(1, 40)
    neuroticism = random.randint(40, 100) if risk_level == 'critical' else random.randint(1, 70)
    
    return {
        'user': f'USR{emp_id:05d}',
        'user_id': f'USR{emp_id:05d}',
        'employee_name': name,
        'department': department,
        'job_title': job_title,
        'date': '2026-02-23',
        'login_count': login_count,
        'logoff_count': logoff_count,
        'night_logins': night_logins,
        'unique_pcs': unique_pcs,
        'session_duration_total': session_duration_total,
        'session_duration_avg': round(session_duration_avg, 2),
        'usb_count': usb_count,
        'usb_connect': usb_count,
        'usb_disconnect': usb_count - random.randint(0, 2),
        'file_activity_count': file_ops,
        'file_opened': file_opened,
        'file_copied': file_copied,
        'file_deleted': file_deleted,
        'file_downloaded': file_downloaded,
        'file_uploaded': file_uploaded,
        'file_edited': file_edited,
        'total_file_operations': file_ops,
        'sensitive_files_accessed': sensitive_files,
        'unique_files_accessed': random.randint(5, min(file_ops, 50)),
        'systems_accessed': ','.join(random.sample(SYSTEMS, random.randint(3, 7))),
        'file_operations_detail': generate_file_operations(random.randint(40, 80)),
        'database_session_duration': database_session_duration,
        'database_query_count': db_query_count,
        'database_read_ops': database_read_ops,
        'database_write_ops': db_write_ops,
        'primary_database': random.choice(DATABASES),
        'emails_sent': random.randint(10, 100),
        'external_mails': external_emails,
        'email_attachments': random.randint(5, 50),
        'avg_email_size': random.randint(50, 5000),
        'http_requests': http_requests,
        'unique_urls': unique_urls,
        'cctv_anomalies': cctv_anomalies,
        'access_card_anomalies': access_card_anomalies,
        'behavioral_score': round(behavioral_score, 2),
        'anomaly_label': 1 if risk_level == 'critical' else -1,
        'risk_score': round(risk_score, 2),
        'risk_profile': risk_level,
        'O': openness,
        'C': conscientiousness,
        'E': extraversion,
        'A': agreeableness,
        'N': neuroticism
    }

def generate_dataset():
    """Generate full dataset with emp1, emp2 and risk distribution"""
    employees = []
    
    # Create emp1 - Female, Critical Risk
    emp1 = generate_employee(1, 'Sophia Anderson', 'IT Security', 'Senior Analyst', 'F', 'critical')
    emp1['risk_score'] = 95.42  # Ensure > 93
    emp1['risk_profile'] = 'critical'
    emp1['cctv_anomalies'] = 5
    emp1['cctv_face_id'] = 'emp1'
    emp1['gender'] = 'F'
    employees.append(emp1)
    
    # Create emp2 - Male, Initially High Risk
    emp2 = generate_employee(2, 'Marcus Reid', 'Operations', 'Systems Manager', 'M', 'high')
    emp2['cctv_face_id'] = 'emp2'
    emp2['gender'] = 'M'
    employees.append(emp2)
    
    # Generate high risk employees (8 more)
    departments = ['Finance', 'HR', 'IT', 'Operations', 'Sales', 'Marketing', 'Legal', 'Compliance']
    first_names = ['James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas',
                   'Jennifer', 'Linda', 'Barbara', 'Mary', 'Patricia', 'Susan', 'Jessica', 'Sarah']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor']
    
    for i in range(3, 3 + HIGH_RISK_COUNT):
        gender = random.choice(['M', 'F'])
        first = random.choice(first_names)
        last = random.choice(last_names)
        emp = generate_employee(i, f'{first} {last}', random.choice(departments), 
                               random.choice(['Manager', 'Analyst', 'Officer', 'Specialist']), 
                               gender, 'high')
        emp['gender'] = gender
        employees.append(emp)
    
    # Generate medium risk employees (50)
    for i in range(3 + HIGH_RISK_COUNT, 3 + HIGH_RISK_COUNT + MEDIUM_RISK_COUNT):
        gender = random.choice(['M', 'F'])
        first = random.choice(first_names)
        last = random.choice(last_names)
        emp = generate_employee(i, f'{first} {last}', random.choice(departments),
                               random.choice(['Coordinator', 'Assistant', 'Executive', 'Technician']),
                               gender, 'medium')
        emp['gender'] = gender
        employees.append(emp)
    
    # Generate low risk employees (remaining)
    for i in range(3 + HIGH_RISK_COUNT + MEDIUM_RISK_COUNT, 3 + HIGH_RISK_COUNT + MEDIUM_RISK_COUNT + LOW_RISK_COUNT):
        gender = random.choice(['M', 'F'])
        first = random.choice(first_names)
        last = random.choice(last_names)
        emp = generate_employee(i, f'{first} {last}', random.choice(departments),
                               random.choice(['Intern', 'Support', 'Clerk', 'Administrator']),
                               gender, 'low')
        emp['gender'] = gender
        employees.append(emp)
    
    return employees

def write_csv(employees):
    """Write employees to CSV file"""
    if not employees:
        return
    
    fieldnames = list(employees[0].keys())
    
    with open(FILE_OUTPUT, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(employees)
    
    print(f'✅ Generated {len(employees)} employees to {FILE_OUTPUT}')
    print(f'  - emp1 (Female, Critical Risk): {employees[0]["employee_name"]} - Risk: {employees[0]["risk_score"]}')
    print(f'  - emp2 (Male, High Risk): {employees[1]["employee_name"]} - Risk: {employees[1]["risk_score"]}')
    print(f'  - High Risk Employees: {HIGH_RISK_COUNT}')
    print(f'  - Medium Risk Employees: {MEDIUM_RISK_COUNT}')
    print(f'  - Low Risk Employees: {LOW_RISK_COUNT}')

if __name__ == '__main__':
    print('🔄 Generating CCTV detection dataset...')
    employees = generate_dataset()
    write_csv(employees)
    print(f'📊 Total: {len(employees)} employees')
