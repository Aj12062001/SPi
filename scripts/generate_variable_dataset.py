import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta
import json

np.random.seed(42)
random.seed(42)

# Define departments
Departments = ['IT', 'Finance', 'HR', 'Sales', 'Engineering', 'Marketing', 'Operations', 'Legal', 'Administration', 'Support']

# Define job titles per department
job_titles = {
    'IT': ['System Administrator', 'Network Engineer', 'Security Analyst', 'Database Admin', 'IT Manager'],
    'Finance': ['Financial Analyst', 'Accountant', 'Controller', 'CFO', 'Finance Manager'],
    'HR': ['HR Manager', 'Recruiter', 'HR Specialist', 'Benefits Coordinator', 'HR Director'],
    'Sales': ['Sales Manager', 'Account Executive', 'Sales Rep', 'Business Development', 'Sales Director'],
    'Engineering': ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Tech Lead', 'Engineering Manager'],
    'Marketing': ['Marketing Manager', 'Content Specialist', 'SEO Analyst', 'Brand Manager', 'Marketing Director'],
    'Operations': ['Operations Manager', 'Supply Chain Analyst', 'Project Manager', 'Coordinator', 'Operations Director'],
    'Legal': ['Legal Counsel', 'Compliance Officer', 'Paralegal', 'General Counsel', 'Legal Manager'],
    'Administration': ['Admin Assistant', 'Office Manager', 'Receptionist', 'Secretary', 'Admin Supervisor'],
    'Support': ['Support Manager', 'Support Specialist', 'Help Desk', 'Support Lead', 'Technical Support']
}

file_operations = ['open', 'copy', 'delete', 'download', 'upload', 'edit', 'share', 'print']
file_types = ['xlsx', 'docx', 'pdf', 'pptx', 'txt', 'csv', 'sql', 'zip', 'json', 'xml', 'jpg', 'png', 'exe', 'dll']

file_categories = {
    'Finance': ['budget', 'invoice', 'payment', 'transaction', 'report', 'forecast', 'expense', 'ledger', 'audit'],
    'HR': ['employee', 'payroll', 'benefits', 'performance', 'attendance', 'policy', 'contract', 'recruitment'],
    'Sales': ['proposal', 'contract', 'client', 'order', 'quote', 'pipeline', 'forecast', 'customer'],
    'IT': ['config', 'log', 'backup', 'database', 'system', 'network', 'security', 'patch'],
    'Engineering': ['code', 'spec', 'design', 'test', 'build', 'deployment', 'api', 'documentation'],
    'Marketing': ['campaign', 'content', 'social', 'analytics', 'brand', 'media', 'creative', 'email'],
    'Operations': ['process', 'workflow', 'inventory', 'supply', 'logistics', 'vendor', 'order', 'schedule'],
    'Legal': ['contract', 'policy', 'compliance', 'agreement', 'legal', 'regulatory', 'audit', 'nda'],
    'Administration': ['memo', 'schedule', 'request', 'form', 'notice', 'document', 'record', 'file'],
    'Support': ['ticket', 'log', 'incident', 'report', 'issue', 'resolution', 'feedback', 'complaint']
}

systems = ['SAP_ERP', 'Salesforce', 'HRMS', 'FileServer_01', 'FileServer_02', 'Cloud_Storage',
           'Database_Production', 'Database_Dev', 'SharePoint', 'Git_Repository', 'Tableau', 'Jira']


def generate_employee_id():
    return ''.join([random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(3)]) + \
           ''.join([random.choice('0123456789') for _ in range(4)])


def generate_employee_name():
    first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
                   'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
                   'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
                   'Matthew', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
                  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
                  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young']
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def generate_file_name(dept, operation):
    category = random.choice(file_categories.get(dept, file_categories['IT']))
    file_type = random.choice(file_types)
    timestamp = random.randint(20200101, 20241231)

    sensitive_keywords = ['confidential', 'internal', 'private', 'restricted', 'secret']
    is_sensitive = random.random() < 0.15

    if is_sensitive:
        prefix = random.choice(sensitive_keywords)
        return f"{prefix}_{category}_{timestamp}.{file_type}", True
    return f"{category}_{timestamp}.{file_type}", False


def generate_file_operations(dept, base_date, risk_profile):
    operations = []
    total_ops = random.randint(5, 20)
    sensitive_count = 0

    if risk_profile == 'high':
        total_ops += random.randint(10, 20)
    elif risk_profile == 'medium':
        total_ops += random.randint(5, 10)

    for _ in range(total_ops):
        op = random.choice(file_operations)
        file_name, is_sensitive = generate_file_name(dept, op)
        if is_sensitive:
            sensitive_count += 1
        system = random.choice(systems)
        timestamp = base_date + timedelta(minutes=random.randint(0, 1440))
        operations.append({
            "file_name": file_name,
            "operation": op,
            "system": system,
            "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "is_sensitive": is_sensitive,
            "file_size": random.randint(10_000, 50_000_000)
        })

    return operations, sensitive_count


def generate_dataset(num_employees=5000, days=30):
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(days)]

    # Risk distribution: 0.01% high, 2% medium, 97.99% low
    num_high = max(1, int(num_employees * 0.0001))
    num_medium = max(1, int(num_employees * 0.02))
    num_low = num_employees - num_high - num_medium

    employees = []
    for i in range(num_employees):
        dept = random.choice(Departments)
        job_title = random.choice(job_titles[dept])
        user_id = generate_employee_id()
        name = generate_employee_name()

        if i < num_high:
            risk_profile = 'high'
            anomaly_label = -1
        elif i < num_high + num_medium:
            risk_profile = 'medium'
            anomaly_label = random.choice([1, -1])
        else:
            risk_profile = 'low'
            anomaly_label = 1

        employees.append({
            "user_id": user_id,
            "employee_name": name,
            "department": dept,
            "job_title": job_title,
            "risk_profile": risk_profile,
            "anomaly_label": anomaly_label
        })

    random.shuffle(employees)

    records = []
    for idx, emp in enumerate(employees):
        if (idx + 1) % 1000 == 0:
            print(f"Processing employee {idx + 1}/{num_employees}...")
        for date in dates:
            login_count = random.randint(1, 4)
            night_logins = random.randint(0, 1) if emp['risk_profile'] == 'low' else random.randint(0, 3)
            unique_pcs = random.randint(1, 3)
            session_total = random.randint(100, 900)
            session_avg = round(session_total / max(login_count, 1), 2)

            usb_connect = random.randint(0, 1) if emp['risk_profile'] == 'low' else random.randint(0, 3)
            usb_disconnect = usb_connect

            file_ops, sensitive_count = generate_file_operations(emp['department'], date, emp['risk_profile'])

            file_opened = sum(1 for o in file_ops if o['operation'] == 'open')
            file_copied = sum(1 for o in file_ops if o['operation'] == 'copy')
            file_deleted = sum(1 for o in file_ops if o['operation'] == 'delete')
            file_downloaded = sum(1 for o in file_ops if o['operation'] == 'download')
            file_uploaded = sum(1 for o in file_ops if o['operation'] == 'upload')
            file_edited = sum(1 for o in file_ops if o['operation'] == 'edit')
            total_file_ops = len(file_ops)

            systems_accessed = list({o['system'] for o in file_ops})

            emails_sent = random.randint(0, 20)
            external_mails = random.randint(0, 4) if emp['risk_profile'] == 'low' else random.randint(0, 10)
            email_attachments = random.randint(0, 6)
            avg_email_size = round(random.uniform(10, 200), 2)

            http_requests = random.randint(50, 300)
            unique_urls = random.randint(5, 40)

            o = random.randint(10, 60)
            c = random.randint(10, 60)
            e = random.randint(10, 60)
            a = random.randint(10, 60)
            n = random.randint(10, 60)

            records.append({
                "user_id": emp['user_id'],
                "employee_name": emp['employee_name'],
                "department": emp['department'],
                "job_title": emp['job_title'],
                "date": date.strftime('%Y-%m-%d'),
                "login_count": login_count,
                "logoff_count": login_count,
                "night_logins": night_logins,
                "unique_pcs": unique_pcs,
                "session_duration_total": session_total,
                "session_duration_avg": session_avg,
                "usb_connect": usb_connect,
                "usb_disconnect": usb_disconnect,
                "file_opened": file_opened,
                "file_copied": file_copied,
                "file_deleted": file_deleted,
                "file_downloaded": file_downloaded,
                "file_uploaded": file_uploaded,
                "file_edited": file_edited,
                "total_file_operations": total_file_ops,
                "sensitive_files_accessed": sensitive_count,
                "unique_files_accessed": total_file_ops,
                "systems_accessed": ",".join(systems_accessed),
                "file_operations_detail": json.dumps(file_ops),
                "emails_sent": emails_sent,
                "external_mails": external_mails,
                "email_attachments": email_attachments,
                "avg_email_size": avg_email_size,
                "http_requests": http_requests,
                "unique_urls": unique_urls,
                "O": o,
                "C": c,
                "E": e,
                "A": a,
                "N": n,
                "anomaly_label": emp['anomaly_label']
            })

    df = pd.DataFrame(records)
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_employees', type=int, default=5000)
    parser.add_argument('--days', type=int, default=30)
    parser.add_argument('--output', type=str, default='f:/main project/SPi-main/data/comprehensive_employee_data.csv')
    args = parser.parse_args()

    print(f"Generating comprehensive {args.num_employees:,} employee dataset...")
    df = generate_dataset(num_employees=args.num_employees, days=args.days)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print("\n✅ Dataset generated successfully!")
    print("Total records:", len(df))
    print("Unique employees:", df['user_id'].nunique())
    print("Date range:", df['date'].min(), "to", df['date'].max())
    print("\n✅ Dataset saved to:", output_path)
    print("File size:", round(output_path.stat().st_size / (1024 * 1024), 2), "MB")


if __name__ == '__main__':
    main()
