# MedVault – Secure Hospital Records File Management Platform
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazonaws)
![Amazon Linux](https://img.shields.io/badge/Linux-Amazon%20Linux%202023-yellow?logo=linux)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx)
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

![Amazon EC2](https://img.shields.io/badge/Amazon-EC2-FF9900?logo=amazonaws)
![Application Load Balancer](https://img.shields.io/badge/Application-Load%20Balancer-orange)
![Auto Scaling](https://img.shields.io/badge/Auto-Scaling-orange)
![Amazon VPC](https://img.shields.io/badge/Amazon-VPC-blue)
![Internet Gateway](https://img.shields.io/badge/Internet-Gateway-lightgrey)
![NAT Gateway](https://img.shields.io/badge/NAT-Gateway-blue)

![Amazon S3](https://img.shields.io/badge/Amazon-S3-orange)
![CloudFront](https://img.shields.io/badge/CloudFront-AWS-orange)
![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=awslambda)
![API Gateway](https://img.shields.io/badge/API-Gateway-FF4F8B)
![Amazon RDS](https://img.shields.io/badge/Amazon-RDS-527FFF)
![Amazon SNS](https://img.shields.io/badge/Amazon-SNS-FF9900)

![IAM](https://img.shields.io/badge/AWS-IAM-orange)
![VSFTPD](https://img.shields.io/badge/FTP-VSFTPD-blue)
![TLS](https://img.shields.io/badge/TLS-Secured-green)
![NFS](https://img.shields.io/badge/Linux-NFS-success)
![LVM](https://img.shields.io/badge/Linux-LVM-blue)
![LUKS](https://img.shields.io/badge/Linux-LUKS-red)
![Cron](https://img.shields.io/badge/Linux-Cron-green)
![Bash](https://img.shields.io/badge/Bash-Scripting-black?logo=gnubash)
![ACL](https://img.shields.io/badge/Linux-ACL-success)

## Introduction

MedVault is a secure cloud-based Hospital Records File Management Platform developed using AWS and Linux technologies. The project allows doctors to securely upload patient records, nurses to access authorized records, and IT administrators to manage the complete infrastructure. The application follows a secure multi-tier architecture using AWS services and Linux administration concepts to provide high availability, scalability, automation, and data security. Patient records are securely uploaded through FTPS, stored in Amazon S3, metadata is maintained in Amazon RDS, notifications are sent using Amazon SNS, and records are securely delivered through Amazon CloudFront using Signed URLs.

---

# Technologies Used

- Amazon EC2
- Amazon VPC
- Internet Gateway
- NAT Gateway
- Application Load Balancer (ALB)
- Auto Scaling Group (ASG)
- Target Group
- Amazon S3
- Amazon CloudFront
- API Gateway
- AWS Lambda
- Amazon RDS MySQL
- Amazon SNS
- IAM
- Security Groups
- VSFTPD (FTPS)
- Linux Users & Groups
- Linux ACL
- LVM
- LUKS Encryption
- Bash Shell Scripting
- Cron Jobs
- Nginx
- Node.js
- Express.js
- MySQL

---

# AWS Architecture

## AWS Architecture

![AWS Architecture](image/arc.jpg)
```

---

# Project Workflow

1. Doctor accesses the MedVault application through the Application Load Balancer.

2. Login credentials are validated by the Node.js Portal Application.

3. Doctor uploads patient records securely using FTPS.

4. Validation scripts verify the uploaded files.

5. Valid records are stored in Amazon S3.

6. Lambda automatically processes the uploaded file.

7. SNS sends an email notification.

8. Patient metadata is stored in Amazon RDS.

9. CloudFront generates Signed URLs for secure download.

10. Archive Server securely stores old records and backs them up to Amazon S3.

---

# Project Structure

```
MedVault/
│
├── image/
├── public/
├── scripts/
├── sql/
├── src/
├── views/
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

# Login Page

Doctors, Nurses, and IT Administrators securely log in using their authorized credentials.

![Login Page](image/login.jpg)

---

# Upload Patient Records

Doctors securely upload patient records using FTPS. Validation scripts verify every uploaded file before processing.

![Upload](image/upload.jpg)

---

# Doctor Dashboard

Doctors can upload patient records, view uploaded records, and securely download files using CloudFront Signed URLs.

![Dashboard](image/dashboard.jpg)

---

# Secure File Upload (FTPS)

Patient records are transferred securely using FTP over TLS (FTPS). File validation scripts check file extensions and integrity before storing them.

![File Upload](image/file%20uploads.jpg)

---

# Amazon RDS

Amazon RDS MySQL stores patient metadata, user details, upload information, and file references securely.

![RDS](image/RDSDATA.jpg)

---

# Amazon SNS Notification

Whenever a doctor uploads a new patient record, AWS Lambda automatically triggers Amazon SNS to send email notifications.

![SNS](image/snsmail.jpg)

---

# Amazon CloudFront

CloudFront securely delivers patient records using Signed URLs, preventing direct public access to Amazon S3 while improving download performance.

![CloudFront](image/CDN.jpg)

---

# Amazon S3 Synchronization

Validated patient records are securely stored in Amazon S3. Archive backups are also synchronized to S3 for disaster recovery.

![S3 Sync](image/S3SYNC.jpg)

---

# Archive Management

Old patient records are automatically archived using Cron Jobs and Bash scripts. Archive storage is protected using LUKS encrypted storage and backed up to Amazon S3.

![Archive](image/arc.jpg)

---

# Security Features

- Multi-tier AWS Architecture
- Public and Private Subnets
- Bastion Host
- FTPS Secure File Transfer
- IAM Roles
- Security Groups
- Linux ACL Permissions
- LUKS Disk Encryption
- CloudFront Signed URLs
- API Gateway
- AWS Lambda Automation
- Amazon SNS Notifications
- Auto Scaling
- Application Load Balancer

---

# Conclusion

The MedVault project successfully demonstrates the implementation of a secure, scalable, and highly available Hospital Records File Management Platform using AWS and Linux technologies. Doctors securely upload patient records through FTPS, nurses access authorized records, and IT administrators manage the complete infrastructure. AWS services such as Amazon EC2, VPC, S3, CloudFront, Lambda, API Gateway, Amazon RDS, SNS, Auto Scaling Group, and Application Load Balancer work together to provide secure storage, automated processing, high availability, and efficient content delivery. Linux features including ACLs, LVM, LUKS Encryption, Bash Scripting, and Cron Jobs further enhance system security and automation. The project follows AWS best practices by implementing private networking, secure access through a Bastion Host, encrypted storage, and disaster recovery through Amazon S3 backups.

---

# Developed By

## Ankith N

**AWS Cloud | Linux Administrator | DevOps Enthusiast**
