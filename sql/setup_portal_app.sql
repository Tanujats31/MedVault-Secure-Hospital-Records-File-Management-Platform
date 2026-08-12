-- MedVault Portal - additional schema for the working web app
-- Run this connected as the MASTER user (medvault_admin), not medvault_app,
-- since it needs CREATE TABLE and GRANT privileges.
-- (From Portal: mysql -h <rds-endpoint> -u medvault_admin -p medvault)

USE medvault;

-- Login accounts for the web portal itself (separate from the Linux/FTP
-- accounts on the File Server - see the setup guide's explanation of why).
CREATE TABLE IF NOT EXISTS portal_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(128) NOT NULL,
  role          ENUM('doctor','nurse','itadmin') NOT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session store table, in the exact schema express-mysql-session expects.
-- The app connects with createDatabaseTable:false and just uses this table,
-- since medvault_app is not granted CREATE privileges (least privilege).
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires    INT UNSIGNED NOT NULL,
  data       MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Extend medvault_app's grants (Phase 8 only covered patient_files and
-- upload_audit_log) to cover the two new tables.
GRANT SELECT, INSERT, UPDATE ON medvault.portal_users TO 'medvault_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON medvault.sessions TO 'medvault_app'@'%';
FLUSH PRIVILEGES;

SHOW TABLES;
