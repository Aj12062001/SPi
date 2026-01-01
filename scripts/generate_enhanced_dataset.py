import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Define departments
departments = ['IT', 'Finance', 'HR', 'Sales', 'Engineering', 'Marketing', 'Operations', 'Legal']

# Define job titles per department
job_titles = {
    'IT': ['System Administrator', 'Network Engineer', 'Security Analyst', 'Database Admin'],
    'Finance': ['Financial Analyst', 'Accountant', 'Controller', 'CFO'],
    'HR': ['HR Manager', 'Recruiter', 'HR Specialist', 'Benefits Coordinator'],
    'Sales': ['Sales Manager', 'Account Executive', 'Sales Rep', 'Business Development'],
    'Engineering': ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Tech Lead'],
    'Marketing': ['Marketing Manager', 'Content Specialist', 'SEO Analyst', 'Brand Manager'],
    'Operations': ['Operations Manager', 'Supply Chain Analyst', 'Project Manager', 'Coordinator'],
    'Legal': ['Legal Counsel', 'Compliance Officer', 'Paralegal', 'General Counsel']
}

# File operations types
file_operations = ['open', 'copy', 'delete', 'download', 'upload', 'edit', 'share', 'print']

# File types
file_types = ['xlsx', 'docx', 'pdf', 'pptx', 'txt', 'csv', 'sql', 'zip', 'json', 'xml']

# File categories (for generating meaningful file names)
file_categories = {
    'Finance': ['budget', 'invoice', 'payment', 'transaction', 'report', 'forecast', 'expense'],
    'HR': ['employee', 'payroll', 'benefits', 'performance', 'attendance', 'policy', 'contract'],
    'Sales': ['proposal', 'contract', 'client', 'order', 'quote', 'pipeline', 'forecast'],
    'IT': ['config', 'log', 'backup', 'database', 'system', 'network', 'security'],
    'Engineering': ['code', 'spec', 'design', 'test', 'build', 'deployment', 'api'],
    'Marketing': ['campaign', 'content', 'social', 'analytics', 'brand', 'media', 'creative'],
    'Operations': ['process', 'workflow', 'inventory', 'supply', 'logistics', 'vendor', 'order'],
    'Legal': ['contract', 'policy', 'compliance', 'agreement', 'legal', 'regulatory', 'audit']
}

# System names
systems = ['SAP_ERP', 'Salesforce', 'HRMS', 'FileServer_01', 'FileServer_02', 'Cloud_Storage', 
           'Database_Production', 'Database_Dev', 'SharePoint', 'Git_Repository']

# Generate employee names and IDs
def generate_employee_id():
    return ''.join([random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(3)]) + \
           ''.join([random.choice('0123456789') for _ in range(4)])

def generate_employee_name():
    first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
                   'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
                   'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
                  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson']
    return f"{random.choice(first_names)} {random.choice(last_names)}"

# Generate file name based on department
def generate_file_name(dept, operation):
    category = random.choice(file_categories[dept])
    file_type = random.choice(file_types)
    timestamp = random.randint(20200101, 20241231)
    
    # Some operations on sensitive files
    sensitive_keywords = ['confidential', 'internal', 'private', 'restricted']
    is_sensitive = random.random() < 0.2  # 20% sensitive files
    
    if is_sensitive:
        prefix = random.choice(sensitive_keywords)
        return f"{prefix}_{category}_{timestamp}.{file_type}", True
    else:
        return f"{category}_{timestamp}.{file_type}", False

# Generate comprehensive dataset
def generate_comprehensive_dataset(num_employees=100, days=30):
    data = []
    
    # Create employees
    employees = []
    for i in range(num_employees):
        emp_id = generate_employee_id()
        emp_name = generate_employee_name()
        dept = random.choice(departments)
        job_title = random.choice(job_titles[dept])
        
        # Risk profile (20% high risk, 30% medium, 50% low)
        risk_profile = random.choices(['low', 'medium', 'high'], weights=[0.5, 0.3, 0.2])[0]
        
        employees.append({
            'user_id': emp_id,
            'employee_name': emp_name,
            'department': dept,
            'job_title': job_title,
            'risk_profile': risk_profile
        })
    
    # Generate daily activities for each employee
    start_date = datetime(2024, 1, 1)
    
    for emp in employees:
        # Determine activity levels based on risk profile
        if emp['risk_profile'] == 'high':
            login_range = (5, 15)
            file_ops_range = (30, 100)
            night_login_prob = 0.4
            usb_prob = 0.3
            sensitive_file_prob = 0.4
            delete_prob = 0.3
            download_prob = 0.5
        elif emp['risk_profile'] == 'medium':
            login_range = (3, 8)
            file_ops_range = (10, 40)
            night_login_prob = 0.15
            usb_prob = 0.1
            sensitive_file_prob = 0.15
            delete_prob = 0.1
            download_prob = 0.2
        else:  # low risk
            login_range = (1, 5)
            file_ops_range = (2, 20)
            night_login_prob = 0.05
            usb_prob = 0.02
            sensitive_file_prob = 0.05
            delete_prob = 0.02
            download_prob = 0.05
        
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
            usb_disconnect = usb_connect  # Assume they disconnect what they connect
            
            # File operations
            total_file_ops = random.randint(*file_ops_range)
            file_opened = int(total_file_ops * random.uniform(0.4, 0.6))
            file_copied = int(total_file_ops * random.uniform(0.1, 0.3))
            file_deleted = int(total_file_ops * delete_prob * random.uniform(0, 0.5))
            file_downloaded = int(total_file_ops * download_prob * random.uniform(0, 0.5))
            file_uploaded = int(total_file_ops * random.uniform(0, 0.2))
            file_edited = total_file_ops - (file_opened + file_copied + file_deleted + file_downloaded + file_uploaded)
            file_edited = max(0, file_edited)
            
            # Generate file access details
            files_accessed = []
            sensitive_file_count = 0
            
            for op_type, op_count in [('open', file_opened), ('copy', file_copied), 
                                       ('delete', file_deleted), ('download', file_downloaded),
                                       ('upload', file_uploaded), ('edit', file_edited)]:
                for _ in range(op_count):
                    file_name, is_sensitive = generate_file_name(emp['department'], op_type)
                    system = random.choice(systems)
                    
                    if is_sensitive:
                        sensitive_file_count += 1
                    
                    files_accessed.append({
                        'operation': op_type,
                        'file_name': file_name,
                        'system': system,
                        'is_sensitive': is_sensitive,
                        'timestamp': (current_date + timedelta(
                            hours=random.randint(0, 23),
                            minutes=random.randint(0, 59)
                        )).strftime('%Y-%m-%d %H:%M:%S')
                    })
            
            # Email activity
            emails_sent = random.randint(0, 50)
            external_mails = int(emails_sent * random.uniform(0.1, 0.4))
            email_attachments = int(emails_sent * random.uniform(0.2, 0.5))
            avg_email_size = random.randint(5000, 50000)
            
            # HTTP/Web activity
            http_requests = random.randint(10, 300)
            unique_urls = int(http_requests * random.uniform(0.3, 0.7))
            
            # Personality scores (Big 5)
            O = random.randint(10, 50)  # Openness
            C = random.randint(10, 50)  # Conscientiousness
            E = random.randint(10, 50)  # Extraversion
            A = random.randint(10, 50)  # Agreeableness
            N = random.randint(10, 50)  # Neuroticism
            
            # Calculate risk score
            risk_factors = [
                night_logins * 5,
                usb_connect * 3,
                file_deleted * 4,
                file_downloaded * 2,
                sensitive_file_count * 6,
                external_mails * 1.5,
                (login_count - 5) * 1 if login_count > 5 else 0
            ]
            
            base_risk = sum(risk_factors)
            
            # Add some randomness
            risk_score = base_risk + random.uniform(-10, 10)
            risk_score = max(0, min(100, risk_score))
            
            # Anomaly label (1 = normal, -1 = anomaly)
            anomaly_label = -1 if risk_score > 65 or sensitive_file_count > 5 else 1
            
            # Create record
            record = {
                'user_id': emp['user_id'],
                'employee_name': emp['employee_name'],
                'department': emp['department'],
                'job_title': emp['job_title'],
                'date': date_str,
                'login_count': login_count,
                'logoff_count': login_count,  # Assume same
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
                'unique_files_accessed': len(set([f['file_name'] for f in files_accessed])),
                'systems_accessed': ','.join(list(set([f['system'] for f in files_accessed]))),
                'file_operations_detail': str(files_accessed[:10]),  # Store first 10 for detail view
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
                'risk_score': round(risk_score, 2),
                'anomaly_label': anomaly_label,
                'risk_profile': emp['risk_profile']
            }
            
            data.append(record)
    
    df = pd.DataFrame(data)
    return df

# Generate the dataset
print("Generating comprehensive dataset...")
df = generate_comprehensive_dataset(num_employees=100, days=30)

# Save to CSV
output_file = 'f:/main project/SPi-main/public/comprehensive_employee_data.csv'
df.to_csv(output_file, index=False)

print(f"Dataset generated successfully!")
print(f"Total records: {len(df)}")
print(f"Unique employees: {df['user_id'].nunique()}")
print(f"Date range: {df['date'].min()} to {df['date'].max()}")
print(f"Risk distribution:")
print(df['risk_profile'].value_counts())
print(f"\nSample records:")
print(df.head())
print(f"\nDataset saved to: {output_file}")
