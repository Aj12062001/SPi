import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import json

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Define departments
departments = ['IT', 'Finance', 'HR', 'Sales', 'Engineering', 'Marketing', 'Operations', 'Legal', 'Administration', 'Support']

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

# File operations types
file_operations = ['open', 'copy', 'delete', 'download', 'upload', 'edit', 'share', 'print']

# File types
file_types = ['xlsx', 'docx', 'pdf', 'pptx', 'txt', 'csv', 'sql', 'zip', 'json', 'xml', 'jpg', 'png', 'exe', 'dll']

# File categories (for generating meaningful file names)
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

# System names
systems = ['SAP_ERP', 'Salesforce', 'HRMS', 'FileServer_01', 'FileServer_02', 'Cloud_Storage', 
           'Database_Production', 'Database_Dev', 'SharePoint', 'Git_Repository', 'Tableau', 'Jira']

# Generate employee names and IDs
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

# Generate file name based on department
def generate_file_name(dept, operation):
    category = random.choice(file_categories.get(dept, file_categories['IT']))
    file_type = random.choice(file_types)
    timestamp = random.randint(20200101, 20241231)
    
    # Some operations on sensitive files
    sensitive_keywords = ['confidential', 'internal', 'private', 'restricted', 'secret']
    is_sensitive = random.random() < 0.15  # 15% sensitive files
    
    if is_sensitive:
        prefix = random.choice(sensitive_keywords)
        return f"{prefix}_{category}_{timestamp}.{file_type}", True
    else:
        return f"{category}_{timestamp}.{file_type}", False

# Generate file operations detail with timestamps
def generate_file_operations(file_ops_count, dept, date_obj):
    operations = []
    for i in range(file_ops_count):
        op_type = random.choice(file_operations)
        file_name, is_sensitive = generate_file_name(dept, op_type)
        system = random.choice(systems)
        
        # Generate timestamp during working hours (mostly) or night hours
        hour = random.choices(
            [random.randint(9, 18), random.randint(0, 8)],
            weights=[0.9, 0.1]
        )[0]
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        timestamp = date_obj.replace(hour=hour, minute=minute, second=second)
        
        operations.append({
            'file_name': file_name,
            'operation': op_type,
            'system': system,
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_sensitive': is_sensitive,
            'file_size': random.randint(1000, 50000000)
        })
    
    return operations

# Generate comprehensive 10k dataset
def generate_comprehensive_10k_dataset(num_employees=5000, days=30):
    data = []
    
    # Create employees with risk distribution: 0.001% high, 5% medium, 94.999% low
    num_high = max(1, int(num_employees * 0.00001))  # 0.001%
    num_medium = max(50, int(num_employees * 0.05))   # 5%
    num_low = num_employees - num_high - num_medium   # remaining
    
    risk_profiles = (['high'] * num_high) + (['medium'] * num_medium) + (['low'] * num_low)
    random.shuffle(risk_profiles)
    
    employees = []
    for i in range(num_employees):
        emp_id = generate_employee_id()
        emp_name = generate_employee_name()
        dept = random.choice(departments)
        job_title = random.choice(job_titles[dept])
        risk_profile = risk_profiles[i]
        
        employees.append({
            'user_id': emp_id,
            'employee_name': emp_name,
            'department': dept,
            'job_title': job_title,
            'risk_profile': risk_profile
        })
    
    print(f"Generated {num_employees} employees")
    print(f"High risk: {num_high} ({num_high/num_employees*100:.4f}%)")
    print(f"Medium risk: {num_medium} ({num_medium/num_employees*100:.2f}%)")
    print(f"Low risk: {num_low} ({num_low/num_employees*100:.2f}%)")
    
    # Generate daily activities for each employee
    start_date = datetime(2024, 1, 1)
    
    for emp_idx, emp in enumerate(employees):
        if (emp_idx + 1) % 1000 == 0:
            print(f"Processing employee {emp_idx + 1}/{num_employees}...")
        
        # Determine activity levels based on risk profile
        if emp['risk_profile'] == 'high':
            login_range = (5, 15)
            file_ops_range = (30, 100)
            night_login_prob = 0.4
            usb_prob = 0.35
            sensitive_file_prob = 0.4
            delete_prob = 0.35
            download_prob = 0.6
            external_email_prob = 0.4
        elif emp['risk_profile'] == 'medium':
            login_range = (3, 8)
            file_ops_range = (10, 40)
            night_login_prob = 0.15
            usb_prob = 0.1
            sensitive_file_prob = 0.15
            delete_prob = 0.1
            download_prob = 0.2
            external_email_prob = 0.15
        else:  # low risk
            login_range = (1, 5)
            file_ops_range = (2, 20)
            night_login_prob = 0.05
            usb_prob = 0.02
            sensitive_file_prob = 0.05
            delete_prob = 0.02
            download_prob = 0.05
            external_email_prob = 0.05
        
        # Generate data for random days
        num_days_active = random.randint(int(days * 0.7), days)
        active_days = random.sample(range(days), num_days_active)
        
        for day in active_days:
            current_date = start_date + timedelta(days=day)
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Login information
            login_count = random.randint(*login_range)
            night_logins = sum(1 for _ in range(login_count) if random.random() < night_login_prob)
            unique_pcs = random.randint(1, min(3, login_count))
            
            # Session duration (in minutes)
            session_durations = [random.randint(30, 480) for _ in range(login_count)]
            total_session_duration = sum(session_durations)
            avg_session_duration = total_session_duration / login_count if login_count > 0 else 0
            
            # USB activity
            usb_connect = sum(1 for _ in range(login_count) if random.random() < usb_prob)
            usb_disconnect = usb_connect
            
            # File operations
            total_file_ops = random.randint(*file_ops_range)
            file_opened = int(total_file_ops * random.uniform(0.4, 0.6))
            file_copied = int(total_file_ops * random.uniform(0.1, 0.3))
            file_deleted = int(total_file_ops * delete_prob * random.uniform(0, 0.5))
            file_downloaded = int(total_file_ops * download_prob * random.uniform(0, 0.5))
            file_uploaded = int(total_file_ops * random.uniform(0, 0.2))
            file_edited = total_file_ops - (file_opened + file_copied + file_deleted + file_downloaded + file_uploaded)
            file_edited = max(0, file_edited)
            
            # Generate detailed file operations
            file_operations_detail = []
            sensitive_file_count = 0
            unique_files = set()
            
            for op_type, op_count in [('open', file_opened), ('copy', file_copied), 
                                       ('delete', file_deleted), ('download', file_downloaded),
                                       ('upload', file_uploaded), ('edit', file_edited)]:
                ops = generate_file_operations(op_count, emp['department'], current_date)
                for op in ops:
                    if op['is_sensitive']:
                        sensitive_file_count += 1
                    unique_files.add(op['file_name'])
                    file_operations_detail.append(op)
            
            # Email activity
            emails_sent = random.randint(0, 50)
            external_mails = int(emails_sent * random.uniform(0.1, 0.4)) if random.random() < external_email_prob else 0
            email_attachments = int(emails_sent * random.uniform(0.2, 0.5))
            avg_email_size = random.randint(5000, 50000)
            
            # HTTP/Web activity
            http_requests = random.randint(10, 300)
            unique_urls = int(http_requests * random.uniform(0.3, 0.7))
            
            # Personality scores (Big 5)
            O = random.randint(10, 50)
            C = random.randint(10, 50)
            E = random.randint(10, 50)
            A = random.randint(10, 50)
            N = random.randint(10, 50)
            
            # Anomaly label (1 = normal, -1 = anomaly)
            anomaly_label = -1 if sensitive_file_count > 5 else 1
            
            # Create record
            record = {
                'user_id': emp['user_id'],
                'employee_name': emp['employee_name'],
                'department': emp['department'],
                'job_title': emp['job_title'],
                'date': date_str,
                'login_count': login_count,
                'logoff_count': login_count,
                'night_logins': night_logins,
                'unique_pcs': unique_pcs,
                'session_duration_total': total_session_duration,
                'session_duration_avg': round(avg_session_duration, 2),
                'usb_connect': usb_connect,
                'usb_disconnect': usb_disconnect,
                'file_opened': file_opened,
                'file_copied': file_copied,
                'file_deleted': file_deleted,
                'file_downloaded': file_downloaded,
                'file_uploaded': file_uploaded,
                'file_edited': file_edited,
                'total_file_operations': total_file_ops,
                'sensitive_files_accessed': sensitive_file_count,
                'unique_files_accessed': len(unique_files),
                'systems_accessed': ','.join(list(set([f['system'] for f in file_operations_detail[:5]]))),
                'file_operations_detail': json.dumps(file_operations_detail[:20]),  # Store first 20 operations
                'emails_sent': emails_sent,
                'external_mails': external_mails,
                'email_attachments': email_attachments,
                'avg_email_size': avg_email_size,
                'http_requests': http_requests,
                'unique_urls': unique_urls,
                'O': O,
                'C': C,
                'E': E,
                'A': A,
                'N': N,
                'anomaly_label': anomaly_label
            }
            
            data.append(record)
    
    df = pd.DataFrame(data)
    return df

# Generate the dataset
print("Generating comprehensive 5,000 employee dataset...")
df = generate_comprehensive_10k_dataset(num_employees=5000, days=30)

# Save to CSV
output_file = 'f:/main project/SPi-main/data/comprehensive_employee_data.csv'
df.to_csv(output_file, index=False)

print(f"\n✅ Dataset generated successfully!")
print(f"Total records: {len(df)}")
print(f"Unique employees: {df['user_id'].nunique()}")
print(f"Date range: {df['date'].min()} to {df['date'].max()}")
print(f"\n✅ Dataset saved to: {output_file}")
print(f"File size: {df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")
