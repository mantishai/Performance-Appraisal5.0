USE hr_system;

DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDefinition VARCHAR(500)
)
BEGIN
    DECLARE columnExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO columnExists
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
        AND table_name = tableName 
        AND column_name = columnName;
    
    IF columnExists = 0 THEN
        SET @alterSql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @alterSql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Basic Info
CALL AddColumnIfNotExists('employee', 'age', 'INT');
CALL AddColumnIfNotExists('employee', 'nation', 'VARCHAR(30)');
CALL AddColumnIfNotExists('employee', 'birth_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'native_place', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'resume_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'photo', 'VARCHAR(500)');

-- ID Info
CALL AddColumnIfNotExists('employee', 'id_card', 'VARCHAR(18)');
CALL AddColumnIfNotExists('employee', 'political_status', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'archive_location', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'health_report', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'household_type', 'VARCHAR(10)');
CALL AddColumnIfNotExists('employee', 'marriage_status', 'VARCHAR(10)');
CALL AddColumnIfNotExists('employee', 'id_card_start_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'id_card_end_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'id_card_attachment', 'VARCHAR(500)');

-- Contact Info
CALL AddColumnIfNotExists('employee', 'registered_address', 'VARCHAR(200)');
CALL AddColumnIfNotExists('employee', 'current_address', 'VARCHAR(200)');
CALL AddColumnIfNotExists('employee', 'emergency_contact', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'emergency_phone', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'wechat', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'qq', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'postal_code', 'VARCHAR(10)');

-- Education & Title
CALL AddColumnIfNotExists('employee', 'education', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'graduation_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'major', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'school_name', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'degree', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'foreign_language', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'computer_skill', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'title', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'title_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'title_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'title_expire_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'work_years', 'INT');
CALL AddColumnIfNotExists('employee', 'work_field', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'project_level', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'is_manager', 'TINYINT DEFAULT 0');

-- Work Info
CALL AddColumnIfNotExists('employee', 'regular_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'probation_end_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'probation_reminder', 'TINYINT DEFAULT 0');
CALL AddColumnIfNotExists('employee', 'department_nature', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'employee_type', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'direct_superior', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'manager', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'attendance_required', 'TINYINT DEFAULT 1');
CALL AddColumnIfNotExists('employee', 'hire_type', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'union_join_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'confidential_agreement', 'TINYINT DEFAULT 0');
CALL AddColumnIfNotExists('employee', 'work_email', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'office_phone', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'office_location', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'report_to', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'work_city', 'VARCHAR(50)');

-- Salary & Benefits
CALL AddColumnIfNotExists('employee', 'annual_salary', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'social_security_base', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'social_security_company', 'VARCHAR(100)');
CALL AddColumnIfNotExists('employee', 'social_security_start_date', 'DATE');
CALL AddColumnIfNotExists('employee', 'provident_fund_base', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'provident_fund_account', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'performance_bonus_ratio', 'DECIMAL(5,2)');
CALL AddColumnIfNotExists('employee', 'meal_allowance', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'transport_allowance', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'communication_allowance', 'DECIMAL(10,2)');
CALL AddColumnIfNotExists('employee', 'salary_security_level', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employee', 'bank_card', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employee', 'bank_name', 'VARCHAR(100)');

-- Attachments
CALL AddColumnIfNotExists('employee', 'health_report_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'entry_materials_checklist', 'JSON');
CALL AddColumnIfNotExists('employee', 'contract_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'confidentiality_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'non_compete_attachment', 'VARCHAR(500)');
CALL AddColumnIfNotExists('employee', 'archive_status', 'VARCHAR(20)');

-- Subtables

CREATE TABLE IF NOT EXISTS employee_work_experience (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    period VARCHAR(50),
    company VARCHAR(100),
    position VARCHAR(50),
    reference VARCHAR(50),
    phone VARCHAR(20),
    proof_material VARCHAR(500),
    resume_attachment VARCHAR(500),
    leave_reason TEXT,
    job_description TEXT,
    background_check_status VARCHAR(20),
    background_check_date DATE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_work_exp (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_family_member (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(50),
    relation VARCHAR(20),
    company VARCHAR(100),
    phone VARCHAR(20),
    note VARCHAR(200),
    is_emergency TINYINT DEFAULT 0,
    political_status VARCHAR(20),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_family (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_project_performance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    name VARCHAR(100),
    level VARCHAR(50),
    role VARCHAR(50),
    proof_material VARCHAR(500),
    amount DECIMAL(12,2),
    result_description TEXT,
    client_name VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_project (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_department_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    department VARCHAR(100),
    position VARCHAR(50),
    entry_date DATE,
    leave_date DATE,
    note VARCHAR(200),
    transfer_type VARCHAR(20),
    transfer_doc_no VARCHAR(50),
    approval_status VARCHAR(20),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_dept_info (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_education_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    education VARCHAR(20),
    school VARCHAR(100),
    major VARCHAR(50),
    entry_date DATE,
    graduation_date DATE,
    note VARCHAR(200),
    is_fulltime TINYINT DEFAULT 1,
    certificate_attachment VARCHAR(500),
    degree_attachment VARCHAR(500),
    education_verify_status VARCHAR(20),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_edu (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_award (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(100),
    issuer VARCHAR(100),
    date DATE,
    content VARCHAR(500),
    note VARCHAR(200),
    award_level VARCHAR(20),
    certificate_attachment VARCHAR(500),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_award (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_title_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(50),
    issuer VARCHAR(100),
    date DATE,
    expire_date DATE,
    note VARCHAR(200),
    certificate_attachment VARCHAR(500),
    appointment_date DATE,
    remind_sent TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_title (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_registration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(100),
    number VARCHAR(50),
    date DATE,
    expire_date DATE,
    note VARCHAR(200),
    certificate_attachment VARCHAR(500),
    continuing_education VARCHAR(20),
    remind_sent TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_reg (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_position_certificate (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(100),
    number VARCHAR(50),
    date DATE,
    expire_date DATE,
    note VARCHAR(200),
    certificate_attachment VARCHAR(500),
    issuing_authority VARCHAR(100),
    remind_sent TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_pos_cert (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_transfer (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    type VARCHAR(50),
    old_department VARCHAR(100),
    old_position VARCHAR(50),
    new_department VARCHAR(100),
    new_position VARCHAR(50),
    date DATE,
    note VARCHAR(200),
    transfer_doc_no VARCHAR(50),
    after_salary DECIMAL(10,2),
    reason TEXT,
    approver VARCHAR(50),
    approval_status VARCHAR(20),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_transfer (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_process_record (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    name VARCHAR(100),
    type VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    status VARCHAR(20),
    note VARCHAR(200),
    current_node VARCHAR(100),
    approver VARCHAR(50),
    approval_comment TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_process (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_contract (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    contract_type VARCHAR(20),
    contract_no VARCHAR(50),
    sign_date DATE,
    start_date DATE,
    end_date DATE,
    contract_attachment VARCHAR(500),
    renewal_count INT DEFAULT 0,
    is_permanent TINYINT DEFAULT 0,
    remind_sent TINYINT DEFAULT 0,
    note VARCHAR(200),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_contract (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_training (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    training_name VARCHAR(100),
    training_org VARCHAR(100),
    start_date DATE,
    end_date DATE,
    duration VARCHAR(20),
    result VARCHAR(50),
    certificate_attachment VARCHAR(500),
    is_continuing_education TINYINT DEFAULT 0,
    satisfaction_score INT,
    note VARCHAR(200),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_training (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_reward_punishment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    type VARCHAR(10),
    name VARCHAR(100),
    date DATE,
    amount DECIMAL(10,2),
    reason TEXT,
    attachment VARCHAR(500),
    revoke_date DATE,
    revoke_reason TEXT,
    note VARCHAR(200),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_rp (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_background_check (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    check_type VARCHAR(20),
    agency VARCHAR(100),
    check_date DATE,
    result VARCHAR(20),
    report_attachment VARCHAR(500),
    compliance_checklist JSON,
    compliance_status VARCHAR(20),
    note VARCHAR(200),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_bc (employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_reminder (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    reminder_type VARCHAR(20),
    reminder_date DATE,
    is_sent TINYINT DEFAULT 0,
    sent_at DATETIME,
    note VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_reminder (employee_id),
    INDEX idx_reminder_date (reminder_date),
    INDEX idx_is_sent (is_sent)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    change_summary TEXT,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    INDEX idx_employee_audit (employee_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB;

DELIMITER $$
DROP TRIGGER IF EXISTS employee_audit_insert$$
CREATE TRIGGER employee_audit_insert
AFTER INSERT ON employee
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit_log (employee_id, created_by, created_at, updated_by, updated_at, change_summary)
    VALUES (NEW.id, USER(), NOW(), USER(), NOW(), 'Create employee');
END$$

DROP TRIGGER IF EXISTS employee_audit_update$$
CREATE TRIGGER employee_audit_update
AFTER UPDATE ON employee
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit_log (employee_id, created_by, created_at, updated_by, updated_at, change_summary)
    VALUES (NEW.id, (SELECT created_by FROM employee_audit_log WHERE employee_id = OLD.id ORDER BY created_at ASC LIMIT 1), 
            (SELECT created_at FROM employee_audit_log WHERE employee_id = OLD.id ORDER BY created_at ASC LIMIT 1), 
            USER(), NOW(), 'Update employee');
END$$
DELIMITER ;

DESCRIBE employee;
SHOW TABLES LIKE 'employee_%';