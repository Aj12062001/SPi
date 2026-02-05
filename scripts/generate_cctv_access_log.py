import pandas as pd
import json
from datetime import datetime, timedelta
import random

# Generate sample CCTV access log data
def generate_cctv_access_log():
    """
    Generate realistic CCTV access events for demo purposes
    """
    
    employees = {
        'ACC0042': {'name': 'Chandra Costa', 'authorized': False, 'incidents': 3},  # SPY - high risk
        'AAF0535': {'name': 'Anna Anderson', 'authorized': True, 'incidents': 0},
        'ABC0174': {'name': 'Bob Clarke', 'authorized': True, 'incidents': 0},
        'AAE0190': {'name': 'August Armando Evans', 'authorized': True, 'incidents': 1},
        'LOW0001': {'name': 'Low Baseline', 'authorized': True, 'incidents': 0},
    }
    
    access_events = []
    base_time = datetime.now() - timedelta(days=7)
    
    for emp_id, emp_info in employees.items():
        # Normal day access
        normal_times = [
            datetime.combine(base_time.date(), datetime.strptime('09:00', '%H:%M').time()),
            datetime.combine(base_time.date(), datetime.strptime('12:30', '%H:%M').time()),
            datetime.combine(base_time.date(), datetime.strptime('17:30', '%H:%M').time()),
        ]
        
        for access_time in normal_times:
            access_events.append({
                'id': f"cctv_evt_{emp_id}_{len(access_events)}",
                'detectedPersonId': emp_id,
                'detectedPersonName': emp_info['name'],
                'timestamp': access_time.isoformat(),
                'confidence': 0.95,  # High confidence for normal
                'authorized': emp_info['authorized'],
                'location': 'Main Entrance',
                'duration': 5
            })
        
        # Add suspicious incidents for high-risk employees
        if emp_info['incidents'] > 0:
            for i in range(emp_info['incidents']):
                # Off-hours access
                suspicious_time = base_time + timedelta(days=i*2) + timedelta(hours=2)
                suspicious_time = suspicious_time.replace(hour=random.choice([2, 3, 4, 23]))
                
                access_events.append({
                    'id': f"cctv_evt_{emp_id}_suspicious_{i}",
                    'detectedPersonId': emp_id,
                    'detectedPersonName': emp_info['name'],
                    'timestamp': suspicious_time.isoformat(),
                    'confidence': random.uniform(0.45, 0.65),  # Low confidence = suspicious
                    'authorized': False,  # Unauthorized access
                    'location': f"Restricted Area {i+1}",
                    'duration': 15 + random.randint(0, 30)
                })
    
    cctv_log = {
        'videoId': 'cctv_demo_real.mp4',
        'uploadedAt': datetime.now().isoformat(),
        'totalFrames': 600,
        'duration': 50,  # 50 second video
        'accessEvents': access_events,
        'authorizedEmployees': ['ACC0042', 'AAF0535', 'ABC0174', 'AAE0190', 'LOW0001'],
        'unauthorizedAccesses': [evt for evt in access_events if not evt['authorized']]
    }
    
    return cctv_log

# Generate the CCTV log
cctv_log = generate_cctv_access_log()

# Save as JSON
with open('public/demo_cctv/access_log.json', 'w') as f:
    json.dump(cctv_log, f, indent=2)

print("✅ Generated CCTV Access Log: public/demo_cctv/access_log.json")
print(f"📊 Total Access Events: {len(cctv_log['accessEvents'])}")
print(f"🚨 Unauthorized Accesses: {len(cctv_log['unauthorizedAccesses'])}")
print(f"\nUnauthorized Events:")
for evt in cctv_log['unauthorizedAccesses']:
    print(f"  - {evt['detectedPersonName']} at {evt['timestamp']} (Confidence: {evt['confidence']:.2f})")
