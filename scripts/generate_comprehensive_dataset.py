#!/usr/bin/env python3
"""
Generate a comprehensive insider-threat dataset with enriched file/database activity.
"""

import argparse
import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path


def _build_file_operations(
    operation_count: int,
    base_datetime: datetime,
    systems: list[str],
    file_catalog: list[str],
) -> tuple[list[dict], dict]:
    operation_types = ["open", "copy", "delete", "download", "upload", "edit"]
    weights = [0.30, 0.16, 0.12, 0.12, 0.12, 0.18]
    operations: list[dict] = []

    summary = {
        "open": 0,
        "copy": 0,
        "delete": 0,
        "download": 0,
        "upload": 0,
        "edit": 0,
        "sensitive": 0,
        "unique_files": set(),
        "systems": set(),
    }

    for _ in range(operation_count):
        op_type = random.choices(operation_types, weights=weights, k=1)[0]
        file_name = random.choice(file_catalog)
        system = random.choice(systems)
        minute_offset = random.randint(0, 8 * 60)
        op_ts = base_datetime + timedelta(minutes=minute_offset)
        is_sensitive = random.random() < 0.18
        file_size = random.randint(20_000, 12_000_000)

        operations.append(
            {
                "file_name": file_name,
                "operation": op_type,
                "system": system,
                "timestamp": op_ts.strftime("%Y-%m-%d %H:%M:%S"),
                "is_sensitive": is_sensitive,
                "file_size": file_size,
            }
        )

        summary[op_type] += 1
        summary["systems"].add(system)
        summary["unique_files"].add(file_name)
        if is_sensitive:
            summary["sensitive"] += 1

    return operations, summary


def generate_dataset(num_records=10000, output_file="data/dummy_risk_10k.csv", days_window=30):
    random.seed(42)

    headers = [
        "user",
        "user_id",
        "employee_name",
        "department",
        "job_title",
        "date",
        "login_count",
        "logoff_count",
        "night_logins",
        "unique_pcs",
        "session_duration_total",
        "session_duration_avg",
        "usb_count",
        "usb_connect",
        "usb_disconnect",
        "file_activity_count",
        "file_opened",
        "file_copied",
        "file_deleted",
        "file_downloaded",
        "file_uploaded",
        "file_edited",
        "total_file_operations",
        "sensitive_files_accessed",
        "unique_files_accessed",
        "systems_accessed",
        "file_operations_detail",
        "database_session_duration",
        "database_query_count",
        "database_read_ops",
        "database_write_ops",
        "primary_database",
        "emails_sent",
        "external_mails",
        "email_attachments",
        "avg_email_size",
        "http_requests",
        "unique_urls",
        "cctv_anomalies",
        "access_card_anomalies",
        "behavioral_score",
        "anomaly_label",
        "O",
        "C",
        "E",
        "A",
        "N",
    ]

    departments = ["Engineering", "Finance", "Operations", "Marketing", "HR", "Legal", "Sales", "IT", "Security", "Executive"]
    job_titles = ["Senior Developer", "Analyst", "Manager", "Coordinator", "Specialist", "Director", "Consultant", "Officer", "Lead", "Associate"]
    first_names = ["John", "Sarah", "Michael", "Emily", "David", "Jennifer", "James", "Lisa", "Robert", "Maria"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    systems = ["ERP_DB", "HR_DB", "Finance_DB", "CRM_DB", "FileServer_01", "SharePoint", "DataWarehouse"]
    file_catalog = [
        "payroll_q4.xlsx",
        "customer_export.csv",
        "confidential_plan.docx",
        "legal_contract.pdf",
        "infra_access_keys.txt",
        "security_audit.json",
        "roadmap_2026.pptx",
        "backup_manifest.xml",
        "production_dump.sql",
        "hr_candidates.zip",
    ]
    databases = ["ERP_DB", "HR_DB", "FINANCE_DB", "CRM_DB", "AUDIT_DB"]

    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    base_date = datetime.now()

    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for i in range(1, num_records + 1):
            user = f"USR{i:05d}"
            employee_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            department = random.choice(departments)
            job_title = random.choice(job_titles)

            days_back = i % max(1, days_window)
            day = base_date - timedelta(days=days_back)
            date_text = day.strftime("%Y-%m-%d")

            login_count = random.randint(8, 120)
            logoff_count = max(1, login_count - random.randint(0, 3))
            night_logins = random.randint(0, max(1, int(login_count * 0.16)))
            unique_pcs = random.randint(1, 6)

            session_duration_total = random.randint(120, 1800)
            session_duration_avg = round(session_duration_total / max(1, login_count), 2)

            usb_connect = random.randint(0, 25)
            usb_disconnect = max(0, usb_connect - random.randint(0, 2))
            usb_count = usb_connect

            file_activity_count = random.randint(15, 260)
            op_base_dt = day.replace(hour=random.randint(8, 20), minute=random.randint(0, 59), second=0)
            operations, summary = _build_file_operations(file_activity_count, op_base_dt, systems, file_catalog)

            database_query_count = random.randint(30, 2600)
            database_read_ops = random.randint(int(database_query_count * 0.45), int(database_query_count * 0.85))
            database_write_ops = max(0, database_query_count - database_read_ops)
            database_session_duration = random.randint(20, 600)
            primary_database = random.choice(databases)

            emails_sent = random.randint(2, 160)
            external_mails = random.randint(0, max(1, int(emails_sent * 0.45)))
            email_attachments = random.randint(0, max(1, int(emails_sent * 0.35)))
            avg_email_size = random.randint(20, 950)

            http_requests = random.randint(40, 2600)
            unique_urls = random.randint(15, min(600, http_requests))

            cctv_anomalies = random.randint(0, 10)
            access_card_anomalies = random.randint(0, 8)
            behavioral_score = round(random.uniform(15, 96), 2)
            anomaly_label = -1 if random.random() < 0.22 else 1

            writer.writerow(
                [
                    user,
                    user,
                    employee_name,
                    department,
                    job_title,
                    date_text,
                    login_count,
                    logoff_count,
                    night_logins,
                    unique_pcs,
                    session_duration_total,
                    session_duration_avg,
                    usb_count,
                    usb_connect,
                    usb_disconnect,
                    file_activity_count,
                    summary["open"],
                    summary["copy"],
                    summary["delete"],
                    summary["download"],
                    summary["upload"],
                    summary["edit"],
                    file_activity_count,
                    summary["sensitive"],
                    len(summary["unique_files"]),
                    ",".join(sorted(summary["systems"])),
                    json.dumps(operations),
                    database_session_duration,
                    database_query_count,
                    database_read_ops,
                    database_write_ops,
                    primary_database,
                    emails_sent,
                    external_mails,
                    email_attachments,
                    avg_email_size,
                    http_requests,
                    unique_urls,
                    cctv_anomalies,
                    access_card_anomalies,
                    behavioral_score,
                    anomaly_label,
                    random.randint(20, 95),
                    random.randint(20, 95),
                    random.randint(20, 95),
                    random.randint(20, 95),
                    random.randint(20, 95),
                ]
            )

    print(f"✓ Generated {output_path} with {num_records:,} comprehensive employee records")


def main():
    parser = argparse.ArgumentParser(description="Generate comprehensive employee dataset CSV")
    parser.add_argument("--num_employees", type=int, default=10000)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--output", type=str, default="data/dummy_risk_10k.csv")
    args = parser.parse_args()

    generate_dataset(
        num_records=max(1, args.num_employees),
        output_file=args.output,
        days_window=max(1, args.days),
    )


if __name__ == "__main__":
    main()
