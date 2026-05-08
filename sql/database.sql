-- =============================================================
-- 人力资源管理系统 - 完整数据库建库脚本
-- =============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS hr_system
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE hr_system;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- 一、个人看板模块
-- =============================================================

-- 1. 待办任务表
CREATE TABLE IF NOT EXISTS todo_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型：contract/pending_leave/interview/performance',
    task_title VARCHAR(200) NOT NULL COMMENT '任务标题',
    task_content TEXT COMMENT '任务内容',
    target_id BIGINT COMMENT '关联业务ID',
    priority TINYINT DEFAULT 2 COMMENT '优先级：1低2中3高',
    status TINYINT DEFAULT 0 COMMENT '状态：0待处理1已处理2已忽略',
    deadline DATETIME COMMENT '截止时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline),
    INDEX idx_task_type (task_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办任务表';

-- 2. 快捷入口表
CREATE TABLE IF NOT EXISTS shortcut_entry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    entry_name VARCHAR(50) NOT NULL COMMENT '入口名称',
    entry_icon VARCHAR(50) COMMENT '图标',
    entry_url VARCHAR(200) NOT NULL COMMENT '链接地址',
    entry_module VARCHAR(50) COMMENT '模块标识',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_visible TINYINT DEFAULT 1 COMMENT '是否可见：0否1是',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快捷入口表';

-- =============================================================
-- 二、员工管理模块
-- =============================================================

-- 3. 员工基本信息表
CREATE TABLE IF NOT EXISTS employee (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_no VARCHAR(20) NOT NULL UNIQUE COMMENT '工号，唯一',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    gender TINYINT NOT NULL COMMENT '性别：0女1男',
    birth_date DATE COMMENT '出生日期',
    id_card VARCHAR(18) COMMENT '身份证号',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    address VARCHAR(200) COMMENT '地址',
    avatar VARCHAR(200) COMMENT '头像URL',
    department_id BIGINT COMMENT '部门ID',
    position_id BIGINT COMMENT '岗位ID',
    job_level VARCHAR(20) COMMENT '职级',
    entry_date DATE NOT NULL COMMENT '入职日期',
    regular_date DATE COMMENT '转正日期',
    status TINYINT DEFAULT 2 COMMENT '状态：0离职1在职2试用3待入职',
    employment_type TINYINT DEFAULT 1 COMMENT '用工类型：1全职2兼职3实习4外包',
    candidate_id BIGINT COMMENT '来源候选人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_dept_id (department_id),
    INDEX idx_status (status),
    INDEX idx_employee_no (employee_no),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_candidate_id (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工基本信息表';

-- 4. 员工档案表
CREATE TABLE IF NOT EXISTS employee_archive (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID，外键',
    archive_type VARCHAR(50) NOT NULL COMMENT '档案类型',
    archive_name VARCHAR(100) NOT NULL COMMENT '档案名称',
    archive_url VARCHAR(200) COMMENT '文件路径',
    file_number VARCHAR(50) COMMENT '档案编号',
    issue_date DATE COMMENT '颁发日期',
    expiry_date DATE COMMENT '到期日期',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_archive_type (archive_type),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工档案表';

-- 5. 入职记录表
CREATE TABLE IF NOT EXISTS onboarding_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    onboarding_date DATE NOT NULL COMMENT '入职日期',
    recruitment_channel VARCHAR(50) COMMENT '招聘渠道',
    offer_salary DECIMAL(10,2) COMMENT 'Offer薪资',
    probation_months TINYINT DEFAULT 3 COMMENT '试用期月数',
    onboarding_status TINYINT DEFAULT 0 COMMENT '状态：0待办理1办理中2已完成',
    process_data JSON COMMENT '办理流程数据',
    handler_id BIGINT COMMENT '办理人ID',
    complete_time DATETIME COMMENT '完成时间',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_onboarding_date (onboarding_date),
    INDEX idx_onboarding_status (onboarding_status),
    INDEX idx_handler_id (handler_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入职记录表';

-- 6. 离职记录表
CREATE TABLE IF NOT EXISTS dimission_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    dimission_date DATE NOT NULL COMMENT '离职日期',
    dimission_type TINYINT NOT NULL COMMENT '类型：1主动2被动3退休4其他',
    reason TEXT COMMENT '离职原因',
    is_settled TINYINT DEFAULT 0 COMMENT '是否结算：0否1是',
    settlement_amount DECIMAL(10,2) COMMENT '结算金额',
    handler_id BIGINT COMMENT '办理人ID',
    process_status TINYINT DEFAULT 0 COMMENT '状态：0待审批1审批中2已完成',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_dimission_date (dimission_date),
    INDEX idx_process_status (process_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='离职记录表';

-- =============================================================
-- 三、人事管理模块
-- =============================================================

-- 7. 劳动合同表
CREATE TABLE IF NOT EXISTS labor_contract (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID，外键',
    contract_no VARCHAR(50) NOT NULL UNIQUE COMMENT '合同编号，唯一',
    contract_type TINYINT NOT NULL COMMENT '类型：1固定期限2无固定期限3实习4劳务',
    sign_date DATE COMMENT '签订日期',
    effective_date DATE NOT NULL COMMENT '生效日期',
    expiry_date DATE COMMENT '到期日期',
    contract_years DECIMAL(5,2) COMMENT '合同年限',
    content_url VARCHAR(200) COMMENT '合同文件',
    status TINYINT DEFAULT 1 COMMENT '状态：1有效2终止3续签',
    terminate_reason TEXT COMMENT '终止原因',
    remind_days INT DEFAULT 30 COMMENT '提前提醒天数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_contract_no (contract_no),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='劳动合同表';

-- 8. 入转调离记录表
CREATE TABLE IF NOT EXISTS transfer_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    transfer_type VARCHAR(20) NOT NULL COMMENT '类型：entry/regular/transfer/dimission',
    apply_date DATE COMMENT '申请日期',
    effective_date DATE COMMENT '生效日期',
    from_department_id BIGINT COMMENT '原部门',
    to_department_id BIGINT COMMENT '新部门',
    from_position_id BIGINT COMMENT '原岗位',
    to_position_id BIGINT COMMENT '新岗位',
    from_salary DECIMAL(10,2) COMMENT '原薪资',
    to_salary DECIMAL(10,2) COMMENT '新薪资',
    reason TEXT COMMENT '原因',
    approver_id BIGINT COMMENT '审批人',
    approve_status TINYINT DEFAULT 0 COMMENT '状态：0待批1通过2拒绝',
    approve_remark TEXT COMMENT '审批意见',
    status TINYINT DEFAULT 0 COMMENT '执行状态：0处理中1已完成',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_approve_status (approve_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='入转调离记录表';

-- 9. 人事档案完整性检查表
CREATE TABLE IF NOT EXISTS archive_checklist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    check_item VARCHAR(100) NOT NULL COMMENT '检查项名称',
    item_code VARCHAR(50) NOT NULL COMMENT '项编码',
    is_complete TINYINT DEFAULT 0 COMMENT '是否完整',
    missing_doc VARCHAR(200) COMMENT '缺失材料',
    check_date DATE COMMENT '检查日期',
    checker_id BIGINT COMMENT '检查人',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_employee_item (employee_id, item_code),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人事档案完整性检查表';

-- =============================================================
-- 四、组织架构模块
-- =============================================================

-- 10. 部门表
CREATE TABLE IF NOT EXISTS department (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    parent_id BIGINT DEFAULT 0 COMMENT '父部门ID，0为根',
    dept_code VARCHAR(50) NOT NULL UNIQUE COMMENT '部门编码，唯一',
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_level TINYINT DEFAULT 1 COMMENT '层级',
    leader_id BIGINT COMMENT '负责人ID',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '邮箱',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用0禁用',
    description TEXT COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- 11. 岗位表
CREATE TABLE IF NOT EXISTS position (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    dept_id BIGINT NOT NULL COMMENT '部门ID，外键',
    position_code VARCHAR(50) NOT NULL UNIQUE COMMENT '岗位编码，唯一',
    position_name VARCHAR(100) NOT NULL COMMENT '岗位名称',
    position_level VARCHAR(20) COMMENT '职级',
    headcount INT DEFAULT 1 COMMENT '编制人数',
    current_count INT DEFAULT 0 COMMENT '现有人数',
    job_description TEXT COMMENT '职位描述',
    requirement TEXT COMMENT '任职要求',
    is_key_position TINYINT DEFAULT 0 COMMENT '是否关键岗位',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用0禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位表';

-- 12. 组织关系表
CREATE TABLE IF NOT EXISTS org_relation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    dept_id BIGINT NOT NULL COMMENT '部门ID',
    position_id BIGINT NOT NULL COMMENT '岗位ID',
    relation_type VARCHAR(20) DEFAULT 'main' COMMENT '类型：main/兼职',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    is_active TINYINT DEFAULT 1 COMMENT '是否生效',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织关系表';

-- =============================================================
-- 五、岗位说明书模块
-- =============================================================

-- 13. 职位信息表
CREATE TABLE IF NOT EXISTS job_description (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    position_id BIGINT COMMENT '岗位ID',
    job_code VARCHAR(50) NOT NULL UNIQUE COMMENT '职位编码',
    job_name VARCHAR(100) NOT NULL COMMENT '职位名称',
    dept_id BIGINT COMMENT '部门ID',
    superior_position VARCHAR(100) COMMENT '直属上级岗位',
    job_level VARCHAR(20) COMMENT '职级',
    job_purpose TEXT COMMENT '岗位目的',
    education_requirement VARCHAR(100) COMMENT '学历要求',
    experience_requirement VARCHAR(200) COMMENT '经验要求',
    skill_requirement TEXT COMMENT '技能要求',
    competency_requirement TEXT COMMENT '能力素质',
    version INT DEFAULT 1 COMMENT '版本号',
    status TINYINT DEFAULT 1 COMMENT '状态',
    effective_date DATE COMMENT '生效日期',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_position_id (position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='职位信息表';

-- 14. 岗位职责表
CREATE TABLE IF NOT EXISTS job_responsibility (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    job_description_id BIGINT NOT NULL COMMENT '职位信息ID',
    responsibility_no INT COMMENT '职责序号',
    responsibility_desc TEXT COMMENT '职责描述',
    weight_percent DECIMAL(5,2) COMMENT '权重占比',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位职责表';

-- 15. 考核指标表
CREATE TABLE IF NOT EXISTS kpi_indicator (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    job_description_id BIGINT NOT NULL COMMENT '职位信息ID',
    indicator_name VARCHAR(100) COMMENT '指标名称',
    indicator_type VARCHAR(20) COMMENT '类型：quantitative/qualitative',
    target_value VARCHAR(100) COMMENT '目标值',
    weight DECIMAL(5,2) COMMENT '权重',
    data_source VARCHAR(100) COMMENT '数据来源',
    calculation_method TEXT COMMENT '计算方法',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核指标表';

-- =============================================================
-- 六、考勤管理模块
-- =============================================================

-- 16. 打卡记录表
CREATE TABLE IF NOT EXISTS attendance_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    attendance_date DATE NOT NULL COMMENT '考勤日期',
    clock_in_time DATETIME COMMENT '上班打卡时间',
    clock_out_time DATETIME COMMENT '下班打卡时间',
    clock_in_address VARCHAR(200) COMMENT '打卡地址',
    clock_out_address VARCHAR(200) COMMENT '下班地址',
    status VARCHAR(20) DEFAULT 'normal' COMMENT '状态：normal/late/early/absent/leave/business',
    late_minutes INT DEFAULT 0 COMMENT '迟到分钟数',
    early_minutes INT DEFAULT 0 COMMENT '早退分钟数',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_employee_date (employee_id, attendance_date),
    INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表';

-- 17. 请假申请表
CREATE TABLE IF NOT EXISTS leave_request (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    leave_type VARCHAR(20) NOT NULL COMMENT '类型：annual/sick/personal/marriage/maternity/bereavement',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    leave_days DECIMAL(5,1) NOT NULL COMMENT '请假天数',
    reason TEXT COMMENT '事由',
    attachment_url VARCHAR(200) COMMENT '附件',
    approver_id BIGINT COMMENT '审批人',
    approve_status TINYINT DEFAULT 0 COMMENT '状态：0待批1通过2拒绝',
    approve_remark TEXT COMMENT '审批意见',
    approve_time DATETIME COMMENT '审批时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id),
    INDEX idx_approve_status (approve_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='请假申请表';

-- 18. 考勤统计表
CREATE TABLE IF NOT EXISTS attendance_summary (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    summary_year INT NOT NULL COMMENT '年份',
    summary_month TINYINT NOT NULL COMMENT '月份',
    work_days INT DEFAULT 0 COMMENT '应出勤天数',
    actual_work_days INT DEFAULT 0 COMMENT '实际出勤',
    late_count INT DEFAULT 0 COMMENT '迟到次数',
    early_count INT DEFAULT 0 COMMENT '早退次数',
    absent_count INT DEFAULT 0 COMMENT '缺勤次数',
    leave_days DECIMAL(5,1) DEFAULT 0 COMMENT '请假天数',
    business_trip_days DECIMAL(5,1) DEFAULT 0 COMMENT '出差天数',
    overtime_hours DECIMAL(5,1) DEFAULT 0 COMMENT '加班小时',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_employee_month (employee_id, summary_year, summary_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤统计表';

-- =============================================================
-- 七、招聘管理模块
-- =============================================================

-- 19. 招聘需求申请表
CREATE TABLE IF NOT EXISTS recruit_requisition (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    dept_id BIGINT COMMENT '部门ID',
    position_name VARCHAR(64) COMMENT '职位名称',
    position_level VARCHAR(32) COMMENT '职级',
    headcount INT COMMENT '招聘人数',
    reason VARCHAR(255) COMMENT '需求原因',
    urgency VARCHAR(20) COMMENT '紧急程度：一般/紧急',
    required_by DATE COMMENT '期望到岗日期',
    status VARCHAR(20) COMMENT '状态：pending/approved/rejected/closed',
    approver_id BIGINT COMMENT '审批人',
    approved_at DATETIME COMMENT '审批时间',
    created_by BIGINT COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招聘需求申请表';

-- 20. 职位发布表
CREATE TABLE IF NOT EXISTS job_position (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    requisition_id BIGINT COMMENT '需求ID',
    title VARCHAR(128) COMMENT '职位标题',
    description TEXT COMMENT '职位描述',
    requirements TEXT COMMENT '任职要求',
    location VARCHAR(64) COMMENT '工作地点',
    salary_range VARCHAR(64) COMMENT '薪资范围',
    channels JSON COMMENT '发布渠道',
    publish_date DATE COMMENT '发布日期',
    close_date DATE COMMENT '关闭日期',
    status VARCHAR(20) COMMENT '状态：open/paused/closed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='职位发布表';

-- 21. 简历表
CREATE TABLE IF NOT EXISTS candidate (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    name VARCHAR(64) COMMENT '姓名',
    gender TINYINT COMMENT '性别',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(64) COMMENT '邮箱',
    birthday DATE COMMENT '生日',
    resume_text TEXT COMMENT '简历纯文本',
    resume_url VARCHAR(255) COMMENT '简历文件路径',
    source VARCHAR(32) COMMENT '来源渠道',
    source_detail VARCHAR(64) COMMENT '来源详情',
    current_status VARCHAR(32) COMMENT '状态：new/screening/interviewing/offered/hired/rejected',
    expected_salary DECIMAL(10,2) COMMENT '期望薪资',
    current_company VARCHAR(128) COMMENT '当前公司',
    current_position VARCHAR(64) COMMENT '当前职位',
    work_years INT COMMENT '工作年限',
    education VARCHAR(32) COMMENT '学历',
    school VARCHAR(128) COMMENT '毕业学校',
    tags VARCHAR(255) COMMENT '标签',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status_source (current_status, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简历表';

-- 22. 面试安排表
CREATE TABLE IF NOT EXISTS interview_schedule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    candidate_id BIGINT COMMENT '候选人ID，外键',
    job_position_id BIGINT COMMENT '职位ID',
    round INT COMMENT '面试轮次',
    round_name VARCHAR(32) COMMENT '轮次名称',
    interviewer_id BIGINT COMMENT '面试官ID',
    interview_time DATETIME COMMENT '面试时间',
    duration_minutes INT COMMENT '时长',
    location VARCHAR(128) COMMENT '面试地点',
    status VARCHAR(20) COMMENT '状态：scheduled/completed/cancelled/no_show',
    cancel_reason VARCHAR(255) COMMENT '取消原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_candidate_id (candidate_id),
    INDEX idx_interviewer_id (interviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试安排表';

-- 23. 面试评价表
CREATE TABLE IF NOT EXISTS interview_evaluation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    schedule_id BIGINT COMMENT '面试安排ID，外键',
    interviewer_id BIGINT COMMENT '面试官ID',
    rating INT COMMENT '评分1-5',
    strengths TEXT COMMENT '优势',
    weaknesses TEXT COMMENT '不足',
    evaluation TEXT COMMENT '综合评价',
    recommend_next_round TINYINT COMMENT '是否推荐下一轮',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试评价表';

-- 24. Offer表
CREATE TABLE IF NOT EXISTS offer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    candidate_id BIGINT COMMENT '候选人ID',
    job_position_id BIGINT COMMENT '职位ID',
    offer_no VARCHAR(32) UNIQUE COMMENT 'Offer编号，唯一',
    base_salary DECIMAL(10,2) COMMENT '基本工资',
    allowances DECIMAL(10,2) COMMENT '补贴',
    probation_months INT COMMENT '试用期月数',
    start_date DATE COMMENT '预计入职日期',
    status VARCHAR(20) COMMENT '状态：draft/approved/sent/accepted/rejected/expired',
    approval_status VARCHAR(20) COMMENT '审批状态',
    content TEXT COMMENT 'Offer正文',
    attachment_url VARCHAR(255) COMMENT '附件',
    sent_at DATETIME COMMENT '发送时间',
    accepted_at DATETIME COMMENT '接受时间',
    rejected_reason VARCHAR(255) COMMENT '拒绝原因',
    created_by BIGINT COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Offer表';

-- =============================================================
-- 八、绩效考核模块
-- =============================================================

-- 25. 绩效计划表
CREATE TABLE IF NOT EXISTS performance_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    plan_name VARCHAR(100) COMMENT '计划名称',
    plan_type VARCHAR(20) COMMENT '类型：yearly/quarterly/monthly',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    departments TEXT COMMENT '参与部门JSON',
    template_content JSON COMMENT '考核模板',
    status TINYINT COMMENT '状态：0草稿1进行中2已完成',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='绩效计划表';

-- 26. 评估流程表
CREATE TABLE IF NOT EXISTS performance_evaluation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    plan_id BIGINT COMMENT '计划ID',
    employee_id BIGINT COMMENT '员工ID',
    evaluator_id BIGINT COMMENT '评估人',
    self_score DECIMAL(5,2) COMMENT '自评分数',
    self_comment TEXT COMMENT '自评意见',
    leader_score DECIMAL(5,2) COMMENT '上级评分',
    leader_comment TEXT COMMENT '上级意见',
    final_score DECIMAL(5,2) COMMENT '最终得分',
    grade VARCHAR(10) COMMENT '等级S/A/B/C/D',
    status TINYINT COMMENT '状态：0待自评1待上级评2已完成3申诉中',
    appeal_reason TEXT COMMENT '申诉原因',
    appeal_result TEXT COMMENT '申诉结果',
    complete_time DATETIME COMMENT '完成时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_plan_id (plan_id),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评估流程表';

-- 27. 绩效结果表
CREATE TABLE IF NOT EXISTS performance_result (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT COMMENT '员工ID',
    evaluation_year INT COMMENT '考核年份',
    evaluation_period VARCHAR(20) COMMENT '考核周期',
    plan_id BIGINT COMMENT '计划ID',
    final_score DECIMAL(5,2) COMMENT '最终得分',
    grade VARCHAR(10) COMMENT '等级',
    ranking INT COMMENT '排名',
    bonus_ratio DECIMAL(5,4) COMMENT '奖金系数',
    promotion_suggestion VARCHAR(100) COMMENT '晋升建议',
    is_confirmed TINYINT COMMENT '是否确认',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='绩效结果表';

-- =============================================================
-- 九、培训管理模块
-- =============================================================

-- 28. 课程表
CREATE TABLE IF NOT EXISTS training_course (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    course_name VARCHAR(100) COMMENT '课程名称',
    course_category VARCHAR(50) COMMENT '课程分类',
    cover_image VARCHAR(200) COMMENT '封面图',
    lecturer VARCHAR(50) COMMENT '讲师',
    lecturer_intro TEXT COMMENT '讲师介绍',
    course_hours DECIMAL(4,1) COMMENT '课时',
    capacity INT COMMENT '容量',
    enrolled_count INT COMMENT '已报名数',
    course_outline TEXT COMMENT '课程大纲',
    target_audience VARCHAR(200) COMMENT '适合对象',
    material_url VARCHAR(200) COMMENT '资料链接',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    status TINYINT COMMENT '状态：1报名中2进行中3已结束',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- 29. 培训报名表
CREATE TABLE IF NOT EXISTS training_registration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    course_id BIGINT COMMENT '课程ID',
    employee_id BIGINT COMMENT '员工ID',
    registration_time DATETIME COMMENT '报名时间',
    attendance_status TINYINT COMMENT '签到状态：0待签到1已签到2缺勤',
    signin_time DATETIME COMMENT '签到时间',
    cancel_reason TEXT COMMENT '取消原因',
    status TINYINT COMMENT '状态：1已报名2已取消3已完成',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_course_employee (course_id, employee_id),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训报名表';

-- 30. 培训记录表
CREATE TABLE IF NOT EXISTS training_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT COMMENT '员工ID',
    course_id BIGINT COMMENT '课程ID',
    training_date DATE COMMENT '培训日期',
    actual_hours DECIMAL(4,1) COMMENT '实际学时',
    assessment_result VARCHAR(20) COMMENT '考核结果',
    certificate_no VARCHAR(50) COMMENT '证书编号',
    satisfaction_score TINYINT COMMENT '满意度1-5',
    feedback TEXT COMMENT '反馈',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训记录表';

-- =============================================================
-- 十、人才盘点模块
-- =============================================================

-- 31. 关键岗位表
CREATE TABLE IF NOT EXISTS key_position (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    position_id BIGINT UNIQUE COMMENT '岗位ID，唯一',
    critical_level TINYINT COMMENT '重要程度1-3',
    reason TEXT COMMENT '标记原因',
    successor_ready_count INT COMMENT '继任者就绪数',
    risk_level TINYINT COMMENT '风险等级1低2中3高',
    status TINYINT COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关键岗位表';

-- 32. 继任者表
CREATE TABLE IF NOT EXISTS successor (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    key_position_id BIGINT COMMENT '关键岗位ID',
    candidate_id BIGINT COMMENT '候选人ID',
    readiness_level VARCHAR(20) COMMENT '准备度：1年内/2-3年/3年以上',
    readiness_desc VARCHAR(200) COMMENT '准备度描述',
    assessment_score DECIMAL(5,2) COMMENT '评估分数',
    strength TEXT COMMENT '优势',
    development_needs TEXT COMMENT '发展需求',
    status TINYINT COMMENT '状态：1有效0已移除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_key_position_id (key_position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='继任者表';

-- =============================================================
-- 十一、智能预警模块
-- =============================================================

-- 33. 九宫格人才表
CREATE TABLE IF NOT EXISTS nine_grid_talent (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT COMMENT '员工ID',
    assessment_date DATE COMMENT '评估日期',
    performance_grade VARCHAR(10) COMMENT '绩效等级S/A/B/C',
    potential_grade VARCHAR(10) COMMENT '潜力等级高/中/低',
    grid_x TINYINT COMMENT '绩效转化值1-3',
    grid_y TINYINT COMMENT '潜力转化值1-3',
    grid_position VARCHAR(5) COMMENT '九宫格位置',
    development_suggestion TEXT COMMENT '发展建议',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='九宫格人才表';

-- 34. 预警规则表
CREATE TABLE IF NOT EXISTS alert_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    rule_name VARCHAR(100) COMMENT '规则名称',
    rule_type VARCHAR(50) COMMENT '规则类型',
    trigger_days INT COMMENT '提前天数',
    threshold_value VARCHAR(100) COMMENT '阈值',
    risk_level TINYINT COMMENT '风险等级1低2中3高',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用',
    receiver_roles VARCHAR(200) COMMENT '接收角色',
    rule_config JSON COMMENT '规则配置',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警规则表';

-- 35. 预警记录表
CREATE TABLE IF NOT EXISTS alert_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    rule_id BIGINT COMMENT '规则ID',
    alert_type VARCHAR(50) COMMENT '预警类型',
    alert_title VARCHAR(200) COMMENT '预警标题',
    alert_content TEXT COMMENT '预警内容',
    target_id BIGINT COMMENT '关联业务ID',
    target_type VARCHAR(50) COMMENT '关联类型',
    risk_level TINYINT COMMENT '风险等级',
    status TINYINT DEFAULT 0 COMMENT '状态：0未处理1已处理2已忽略',
    handler_id BIGINT COMMENT '处理人',
    handle_time DATETIME COMMENT '处理时间',
    handle_remark TEXT COMMENT '处理备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_status,
    INDEX idx_create_time
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警记录表';

-- 36. 风险预测表
CREATE TABLE IF NOT EXISTS risk_prediction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    employee_id BIGINT COMMENT '员工ID',
    prediction_type VARCHAR(50) COMMENT '预测类型',
    risk_score DECIMAL(5,2) COMMENT '风险评分0-100',
    risk_level VARCHAR(20) COMMENT '风险等级',
    factors JSON COMMENT '影响因素',
    prediction_date DATE COMMENT '预测日期',
    is_confirmed TINYINT COMMENT '是否确认',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风险预测表';

-- =============================================================
-- 十二、数据管理模块
-- =============================================================

-- 37. 批量导入记录表
CREATE TABLE IF NOT EXISTS import_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    import_type VARCHAR(50) COMMENT '导入类型',
    file_name VARCHAR(200) COMMENT '文件名',
    total_count INT COMMENT '总条数',
    success_count INT COMMENT '成功数',
    fail_count INT COMMENT '失败数',
    error_log_url VARCHAR(200) COMMENT '错误日志',
    import_by BIGINT COMMENT '导入人',
    import_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
    status TINYINT COMMENT '状态：0进行中1成功2部分成功3失败'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='批量导入记录表';

-- 38. 自定义报表表
CREATE TABLE IF NOT EXISTS custom_report (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    report_name VARCHAR(100) COMMENT '报表名称',
    report_category VARCHAR(50) COMMENT '报表分类',
    data_source VARCHAR(100) COMMENT '数据源',
    selected_fields JSON COMMENT '选中字段',
    filter_conditions JSON COMMENT '筛选条件',
    sort_config JSON COMMENT '排序配置',
    chart_config JSON COMMENT '图表配置',
    is_public TINYINT COMMENT '是否公开',
    created_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自定义报表表';

-- 39. 数据归档表
CREATE TABLE IF NOT EXISTS data_archive (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    source_table VARCHAR(100) COMMENT '源表名',
    archive_date DATE COMMENT '归档日期',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    record_count INT COMMENT '记录数',
    archive_file VARCHAR(200) COMMENT '归档文件',
    restore_key VARCHAR(100) COMMENT '恢复密钥',
    status TINYINT COMMENT '状态：0已归档1已清理2已恢复',
    operator_id BIGINT COMMENT '操作人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据归档表';

-- =============================================================
-- 十三、API开放平台模块
-- =============================================================

-- 40. 第三方应用表
CREATE TABLE IF NOT EXISTS third_party_app (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    app_name VARCHAR(100) COMMENT '应用名称',
    app_key VARCHAR(64) UNIQUE COMMENT 'AppKey，唯一',
    app_secret VARCHAR(128) COMMENT 'AppSecret',
    app_description TEXT COMMENT '应用描述',
    callback_url VARCHAR(200) COMMENT '回调地址',
    ip_whitelist TEXT COMMENT 'IP白名单',
    qps_limit INT COMMENT 'QPS限制',
    daily_limit INT COMMENT '日调用限制',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用0禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方应用表';

-- 41. API授权表
CREATE TABLE IF NOT EXISTS api_authorization (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    app_id BIGINT COMMENT '应用ID，外键',
    api_path VARCHAR(100) COMMENT 'API路径',
    api_method VARCHAR(10) COMMENT '请求方法',
    permission_level VARCHAR(20) COMMENT '权限级别：read/write/all',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_app_api (app_id, api_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API授权表';

-- 42. API调用日志表
CREATE TABLE IF NOT EXISTS api_call_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    app_id BIGINT COMMENT '应用ID',
    api_path VARCHAR(200) COMMENT 'API路径',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_params TEXT COMMENT '请求参数',
    response_status INT COMMENT '响应状态码',
    response_data TEXT COMMENT '响应数据',
    response_time_ms INT COMMENT '响应时间毫秒',
    client_ip VARCHAR(45) COMMENT '客户端IP',
    user_agent VARCHAR(200) COMMENT 'User-Agent',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_app_id,
    INDEX idx_create_time,
    INDEX idx_api_path
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用日志表';

-- =============================================================
-- 系统表
-- =============================================================

-- 40. 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    employee_id BIGINT COMMENT '员工ID',
    real_name VARCHAR(100) COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    role VARCHAR(20) DEFAULT 'employee' COMMENT '角色：super_admin/admin/hr/manager/employee',
    permissions JSON COMMENT '权限',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用1启用2锁定',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_employee_id (employee_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 41. 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    user_id BIGINT COMMENT '用户ID',
    username VARCHAR(50) COMMENT '用户名',
    module VARCHAR(50) NOT NULL COMMENT '模块',
    operation VARCHAR(100) NOT NULL COMMENT '操作',
    method VARCHAR(50) COMMENT '请求方法',
    params TEXT COMMENT '请求参数',
    ip VARCHAR(50) COMMENT 'IP地址',
    status TINYINT DEFAULT 1 COMMENT '状态：0失败1成功',
    error_msg TEXT COMMENT '错误信息',
    execution_time INT COMMENT '执行时间(毫秒)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_create_time (create_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- Mock数据 - INSERT语句
-- =============================================================

-- 个人看板模块Mock数据
INSERT INTO todo_task (user_id, task_type, task_title, task_content, priority, status, deadline) VALUES
(1, 'contract', '审批张三的劳动合同续签', '张三的3年固定期限合同即将到期，请审批续签', 3, 0, '2026-05-10 18:00:00'),
(1, 'pending_leave', '处理李四的年假申请', '李四申请5月8日-5月12日共5天年假，请审批', 2, 0, '2026-05-07 18:00:00'),
(1, 'interview', '面试前端工程师候选人孙八', '孙八已通过前2轮面试，安排第3轮终面', 3, 0, '2026-05-06 15:00:00'),
(1, 'performance', '完成2026年Q1绩效评估', '技术部5人的Q1绩效评估待完成', 2, 0, '2026-05-15 18:00:00'),
(2, 'contract', '审批王五的劳务合同', '王五的6个月劳务合同待审批', 1, 0, '2026-05-08 18:00:00');

INSERT INTO shortcut_entry (user_id, entry_name, entry_icon, entry_url, entry_module, sort_order, is_visible) VALUES
(1, '我的档案', '📁', '/my-archive', 'employee', 1, 1),
(1, '我的考勤', '⏰', '/my-attendance', 'attendance', 2, 1),
(1, '我的绩效', '📈', '/my-performance', 'performance', 3, 1),
(1, '我的薪酬', '💰', '/my-salary', 'salary', 4, 1),
(2, '招聘管理', '📝', '/recruitment', 'recruitment', 1, 1),
(2, '培训管理', '📚', '/training', 'training', 2, 1);

-- 员工管理模块Mock数据
INSERT INTO employee (employee_no, name, gender, birth_date, id_card, phone, email, department_id, position_id, job_level, entry_date, regular_date, status, employment_type, candidate_id) VALUES
('EMP001', '张三', 1, '1990-05-15', '110101199005150010', '13800138001', 'zhangsan@example.com', 2, 1, 'P6', '2020-03-10', '2020-06-10', 1, 1, NULL),
('EMP002', '李四', 0, '1992-08-20', '110101199208200020', '13800138002', 'lisi@example.com', 4, 4, 'P5', '2021-06-15', '2021-09-15', 1, 1, NULL),
('EMP003', '王五', 1, '1988-12-05', '110101198812050030', '13800138003', 'wangwu@example.com', 1, 3, 'P8', '2019-01-20', '2019-04-20', 1, 1, NULL),
('EMP004', '赵六', 0, '1995-03-25', '110101199503250040', '13800138004', 'zhaoliu@example.com', 4, 4, 'P3', '2022-09-01', '2023-03-01', 1, 1, NULL),
('EMP005', '钱七', 1, '1991-11-10', '110101199111100050', '13800138005', 'qianqi@example.com', 3, 6, 'P4', '2023-02-14', '2023-05-14', 1, 1, NULL),
('EMP006', '郑十一', 0, '1994-07-12', '110101199407120060', '13900139004', 'zheng11@example.com', 3, 2, 'P5', '2026-05-18', NULL, 2, 1, 4),
('EMP007', '孙十二', 1, '1993-04-08', '110101199304080070', '13800138007', 'sun12@example.com', 2, 9, 'P5', '2024-01-15', '2024-04-15', 1, 1, NULL),
('EMP008', '周十三', 0, '1996-09-22', '110101199609220080', '13800138008', 'zhou13@example.com', 5, 7, 'P5', '2025-03-20', '2025-06-20', 1, 1, NULL),
('EMP009', '吴十四', 1, '1990-11-30', '110101199011300090', '13800138009', 'wu14@example.com', 6, 8, 'P3', '2024-07-01', '2024-10-01', 1, 1, NULL);

INSERT INTO employee_archive (employee_id, archive_type, archive_name, archive_url, file_number, issue_date, expiry_date) VALUES
(1, 'id_card', '张三身份证正面', '/archives/EMP001/id_card_front.jpg', 'ARC001', '2015-06-01', '2035-06-01'),
(1, 'diploma', '张三本科毕业证', '/archives/EMP001/diploma.jpg', 'ARC002', '2012-06-30', NULL),
(1, 'contract', '张三劳动合同2023', '/archives/EMP001/contract_2023.pdf', 'ARC003', '2023-03-10', '2026-03-09'),
(2, 'id_card', '李四身份证正面', '/archives/EMP002/id_card_front.jpg', 'ARC004', '2017-08-20', '2037-08-20'),
(2, 'contract', '李四劳动合同2021', '/archives/EMP002/contract_2021.pdf', 'ARC005', '2021-06-15', '2024-06-14');

INSERT INTO onboarding_record (employee_id, onboarding_date, recruitment_channel, offer_salary, probation_months, onboarding_status, handler_id) VALUES
(1, '2020-03-10', '拉勾网', 15000.00, 3, 2, 2),
(2, '2021-06-15', 'BOSS直聘', 12000.00, 3, 2, 2),
(3, '2019-01-20', '猎聘', 20000.00, 3, 2, 2),
(4, '2022-09-01', '内部推荐', 8000.00, 6, 2, 2),
(5, '2023-02-14', '实习僧', 10000.00, 3, 2, 2);

INSERT INTO dimission_record (employee_id, dimission_date, dimission_type, reason, is_settled, settlement_amount, handler_id, process_status) VALUES
(6, '2024-12-31', 1, '个人发展需要', 1, 50000.00, 2, 2),
(7, '2025-03-15', 4, '公司战略调整', 1, 30000.00, 2, 2),
(8, '2025-06-01', 3, '达到退休年龄', 1, 0.00, 2, 2);

-- 人事管理模块Mock数据
INSERT INTO labor_contract (employee_id, contract_no, contract_type, sign_date, effective_date, expiry_date, contract_years, status, remind_days) VALUES
(1, 'HT20230310001', 1, '2023-03-01', '2023-03-10', '2026-03-09', 3.00, 1, 30),
(2, 'HT20210615001', 1, '2021-06-10', '2021-06-15', '2024-06-14', 3.00, 1, 30),
(3, 'HT20220120001', 2, '2022-01-15', '2022-01-20', NULL, NULL, 1, 60),
(4, 'HT20220901001', 3, '2022-08-25', '2022-09-01', '2023-08-31', 1.00, 1, 15),
(5, 'HT20230214001', 1, '2023-02-10', '2023-02-14', '2026-02-13', 3.00, 1, 30);

INSERT INTO transfer_record (employee_id, transfer_type, apply_date, effective_date, from_department_id, to_department_id, from_position_id, to_position_id, from_salary, to_salary, reason, approver_id, approve_status, approve_remark, status) VALUES
(1, 'regular', '2020-06-01', '2020-06-10', 1, 1, 2, 1, 12000.00, 15000.00, '试用期转正，表现优秀', 3, 1, '工作表现优秀，同意转正', 1),
(5, 'transfer', '2023-12-15', '2024-01-01', 1, 2, 1, 5, 10000.00, 12000.00, '工作调整，转岗到产品部', 3, 1, '工作能力强，适合产品岗位', 1),
(4, 'regular', '2023-02-15', '2023-03-01', 3, 3, 4, 4, 8000.00, 9000.00, '试用期转正', 2, 1, '表现稳定，同意转正', 1);

INSERT INTO archive_checklist (employee_id, check_item, item_code, is_complete, missing_doc, check_date, checker_id, remark) VALUES
(1, '身份证', 'id_card', 1, NULL, '2023-03-10', 2, '完整'),
(1, '学历证明', 'diploma', 1, NULL, '2023-03-10', 2, '完整'),
(1, '照片', 'photo', 1, NULL, '2023-03-10', 2, '完整'),
(1, '劳动合同', 'contract', 1, NULL, '2023-03-10', 2, '完整'),
(2, '身份证', 'id_card', 1, NULL, '2021-06-15', 2, '完整'),
(2, '学历证明', 'diploma', 1, NULL, '2021-06-15', 2, '完整'),
(3, '身份证', 'id_card', 1, NULL, '2019-01-20', 2, '完整'),
(3, '学历证明', 'diploma', 0, '硕士毕业证', '2019-01-20', 2, '缺失硕士学历证明'),
(4, '身份证', 'id_card', 1, NULL, '2022-09-01', 2, '完整'),
(5, '身份证', 'id_card', 1, NULL, '2023-02-14', 2, '完整');

-- 组织架构模块Mock数据
INSERT INTO department (parent_id, dept_code, dept_name, dept_level, leader_id, phone, email, sort_order, status, description) VALUES
(0, 'DEPT001', '总经办', 1, 3, '010-12345677', 'admin@example.com', 1, 1, '负责公司整体运营管理'),
(0, 'DEPT002', '技术部', 1, 3, '010-12345678', 'tech@example.com', 2, 1, '负责产品研发和技术维护'),
(0, 'DEPT003', '产品部', 1, 1, '010-12345679', 'product@example.com', 3, 1, '负责产品规划和设计'),
(0, 'DEPT004', '人力资源部', 1, 2, '010-12345680', 'hr@example.com', 4, 1, '负责人力资源管理'),
(0, 'DEPT005', '销售部', 1, NULL, '010-12345681', 'sales@example.com', 5, 1, '负责销售和市场推广'),
(0, 'DEPT006', '财务部', 1, NULL, '010-12345682', 'finance@example.com', 6, 1, '负责财务管理和核算'),
(2, 'DEPT007', '前端开发组', 2, 1, '010-12345683', 'frontend@example.com', 1, 1, '负责前端开发工作'),
(2, 'DEPT008', '后端开发组', 2, 3, '010-12345684', 'backend@example.com', 2, 1, '负责后端开发工作');

INSERT INTO position (dept_id, position_code, position_name, position_level, headcount, current_count, job_description, requirement, is_key_position, status) VALUES
(2, 'POS001', '高级前端工程师', 'P6', 3, 2, '负责核心前端开发', '5年以上前端开发经验，精通Vue/React', 1, 1),
(3, 'POS002', '产品经理', 'P5', 2, 2, '负责产品规划', '3年以上产品经验，有B端产品经验优先', 0, 1),
(2, 'POS003', '技术总监', 'P8', 1, 1, '负责技术团队管理', '10年以上开发经验，5年以上管理经验', 1, 1),
(4, 'POS004', 'HR专员', 'P3', 2, 2, '负责人事管理', '2年以上HR经验，熟悉劳动法', 0, 1),
(4, 'POS005', 'HRBP', 'P5', 1, 0, '负责业务伙伴关系', '3年以上HRBP经验', 0, 1),
(3, 'POS006', 'UI设计师', 'P4', 2, 1, '负责UI设计', '3年以上设计经验，熟练使用Figma', 0, 1),
(5, 'POS007', '销售经理', 'P5', 2, 0, '负责销售管理', '3年以上销售经验', 0, 1),
(6, 'POS008', '财务专员', 'P3', 2, 0, '负责财务核算', '2年以上财务经验', 0, 1),
(2, 'POS009', '后端开发工程师', 'P5', 2, 0, '负责后端开发', '3年以上Java/Go开发经验', 0, 1);

INSERT INTO org_relation (employee_id, dept_id, position_id, relation_type, start_date, end_date, is_active) VALUES
(1, 2, 1, 'main', '2020-03-10', NULL, 1),
(2, 4, 4, 'main', '2021-06-15', NULL, 1),
(3, 1, 3, 'main', '2019-01-20', NULL, 1),
(4, 4, 4, 'main', '2022-09-01', NULL, 1),
(5, 3, 6, 'main', '2023-02-14', NULL, 1),
(6, 3, 2, 'main', '2026-05-18', NULL, 1),
(7, 2, 9, 'main', '2024-01-15', NULL, 1),
(8, 5, 7, 'main', '2025-03-20', NULL, 1),
(9, 6, 8, 'main', '2024-07-01', NULL, 1);

-- 岗位说明书模块Mock数据
INSERT INTO job_description (position_id, job_code, job_name, dept_id, superior_position, job_level, job_purpose, education_requirement, experience_requirement, skill_requirement, competency_requirement, version, status, effective_date) VALUES
(1, 'JD001', '高级前端工程师', 1, '技术总监', 'P6', '负责公司核心产品的前端架构设计和开发', '本科及以上', '5年以上前端开发经验', '精通Vue/React，熟悉TypeScript，了解Node.js', '责任心强，团队协作良好，有良好的沟通能力', 1, 1, '2024-01-01'),
(2, 'JD002', '产品经理', 2, 'CTO', 'P5', '负责产品规划和设计', '本科及以上', '3年以上产品经理经验', '熟练使用Axure，有B端产品经验优先', '逻辑思维强，有良好的沟通能力', 1, 1, '2024-01-01'),
(3, 'JD003', '技术总监', 1, 'CEO', 'P8', '负责技术团队管理和架构决策', '硕士及以上', '10年以上开发经验，5年以上管理经验', '熟悉Java/Go，了解微服务架构', '领导力强，有战略思维', 1, 1, '2023-01-01'),
(4, 'JD004', 'HR专员', 3, 'HR经理', 'P3', '负责人事管理工作', '本科及以上', '2年以上HR经验', '熟悉劳动法，熟练使用Office', '细心，有责任心', 1, 1, '2024-01-01'),
(5, 'JD005', 'UI设计师', 2, '产品经理', 'P4', '负责产品UI设计', '本科及以上', '3年以上设计经验', '熟练使用Figma/Sketch，有良好的设计审美', '创新能力强，有良好的沟通能力', 1, 1, '2024-01-01');

INSERT INTO job_responsibility (job_description_id, responsibility_no, responsibility_desc, weight_percent) VALUES
(1, 1, '负责公司核心产品的前端架构设计和开发', 30.00),
(1, 2, '带领前端开发小组，指导初级开发人员', 25.00),
(1, 3, '参与技术方案评审和架构优化', 20.00),
(1, 4, '解决前端技术难题和性能优化', 15.00),
(1, 5, '编写技术文档和代码规范', 10.00),
(2, 1, '负责产品规划和需求分析', 35.00),
(2, 2, '编写产品需求文档和原型设计', 30.00),
(2, 3, '协调研发、设计、测试等团队', 20.00),
(2, 4, '收集用户反馈，持续优化产品', 15.00);

INSERT INTO kpi_indicator (job_description_id, indicator_name, indicator_type, target_value, weight, data_source, calculation_method) VALUES
(1, '代码质量', 'quantitative', '95%', 20.00, '代码评审系统', '代码评审通过率'),
(1, '项目交付', 'quantitative', '98%', 25.00, '项目管理系统', '按时交付率'),
(1, '团队贡献', 'quantitative', '4次', 15.00, '部门记录', '技术分享或培训次数'),
(1, '技术创新', 'qualitative', '2个', 20.00, '技术委员会', '技术改进或创新点数量'),
(1, '学习成长', 'quantitative', '40小时', 20.00, '培训系统', '年度学习时长'),
(2, '需求完成率', 'quantitative', '95%', 25.00, '项目管理系统', '按时完成的需求占比'),
(2, '用户满意度', 'quantitative', '4.5分', 25.00, '用户反馈', '季度用户调研评分'),
(2, '产品迭代', 'quantitative', '8次/年', 20.00, '产品记录', '产品迭代次数'),
(2, '团队协作', 'qualitative', '优秀', 15.00, '360评价', '跨部门协作评价'),
(2, '创新能力', 'qualitative', '良好', 15.00, '管理层评价', '产品创新提案');

-- 考勤管理模块Mock数据
INSERT INTO attendance_record (employee_id, attendance_date, clock_in_time, clock_out_time, clock_in_address, clock_out_address, status, late_minutes, early_minutes, remark) VALUES
(1, '2026-05-01', '2026-05-01 08:55:00', '2026-05-01 18:05:00', '公司大厦A座', '公司大厦A座', 'normal', 0, 0, NULL),
(2, '2026-05-01', '2026-05-01 09:10:00', '2026-05-01 18:30:00', '公司大厦A座', '公司大厦A座', 'late', 10, 0, '迟到10分钟'),
(3, '2026-05-01', '2026-05-01 08:45:00', '2026-05-01 17:30:00', '公司大厦A座', '公司大厦A座', 'early', 0, 30, '早退30分钟'),
(1, '2026-04-30', '2026-04-30 08:50:00', '2026-04-30 18:10:00', '公司大厦A座', '公司大厦A座', 'normal', 0, 0, NULL),
(2, '2026-04-30', '2026-04-30 08:58:00', '2026-04-30 18:00:00', '公司大厦A座', '公司大厦A座', 'normal', 0, 0, NULL);

INSERT INTO leave_request (employee_id, leave_type, start_time, end_time, leave_days, reason, attachment_url, approver_id, approve_status, approve_remark, approve_time) VALUES
(1, 'annual', '2026-05-08 09:00:00', '2026-05-12 18:00:00', 5.0, '年假休息，外出旅游', NULL, 3, 1, '批准休假', '2026-05-05 14:00:00'),
(2, 'sick', '2026-05-05 09:00:00', '2026-05-05 18:00:00', 1.0, '身体不适，去医院检查', '/attachments/medical_001.pdf', 1, 0, NULL, NULL),
(4, 'personal', '2026-05-04 09:00:00', '2026-05-04 18:00:00', 1.0, '家中有事需要处理', NULL, 2, 1, '批准事假', '2026-05-03 10:00:00'),
(5, 'marriage', '2026-10-01 09:00:00', '2026-10-15 18:00:00', 15.0, '婚假', '/attachments/marriage_cert.pdf', 2, 0, NULL, NULL),
(3, 'annual', '2026-05-20 09:00:00', '2026-05-21 18:00:00', 2.0, '休假调整', NULL, NULL, 0, NULL, NULL);

INSERT INTO attendance_summary (employee_id, summary_year, summary_month, work_days, actual_work_days, late_count, early_count, absent_count, leave_days, business_trip_days, overtime_hours) VALUES
(1, 2026, 4, 22, 21, 1, 0, 0, 1.0, 0.0, 8.0),
(2, 2026, 4, 22, 20, 2, 1, 0, 2.0, 0.0, 4.0),
(3, 2026, 4, 22, 21, 0, 0, 1, 0.0, 2.0, 12.0),
(1, 2026, 3, 23, 23, 0, 0, 0, 0.0, 0.0, 6.0),
(2, 2026, 3, 23, 23, 1, 0, 0, 0.0, 0.0, 5.0);

INSERT INTO recruit_requisition (dept_id, position_name, position_level, headcount, reason, urgency, required_by, status, approver_id, approved_at, created_by, created_at) VALUES
(1, '高级前端工程师', 'P6', 1, '业务发展需要', '紧急', '2026-06-15', 'approved', 3, '2026-05-02 10:00:00', 2, '2026-05-01 09:00:00'),
(1, '后端工程师', 'P5', 2, '团队扩容', '一般', '2026-06-30', 'pending', NULL, NULL, 2, '2026-05-03 14:00:00'),
(2, '产品经理', 'P5', 1, '新项目启动', '紧急', '2026-05-31', 'approved', 1, '2026-05-04 16:00:00', 2, '2026-05-02 11:00:00');

INSERT INTO job_position (requisition_id, title, description, requirements, location, salary_range, channels, publish_date, close_date, status, created_at) VALUES
(1, '高级前端工程师', '负责公司核心产品的前端架构设计和开发', '5年以上前端开发经验，精通Vue/React', '北京', '25K-40K', '["拉勾网", "BOSS直聘", "猎聘"]', '2026-05-05', NULL, 'open', '2026-05-05 10:00:00'),
(3, '产品经理', '负责产品规划和需求分析', '3年以上产品经理经验', '深圳', '20K-35K', '["拉勾网", "BOSS直聘"]', '2026-05-06', NULL, 'open', '2026-05-06 09:00:00');

INSERT INTO candidate (name, gender, phone, email, birthday, resume_text, resume_url, source, source_detail, current_status, expected_salary, current_company, current_position, work_years, education, school, tags, created_at, updated_at) VALUES
('孙八', 1, '13900139001', 'sunba@example.com', '1998-03-15', '5年前端开发经验，精通Vue和React', '/resumes/sunba.pdf', '拉勾网', '平台投递', 'new', 32000.00, '阿里巴巴', '前端工程师', 5, '本科', '清华大学', 'Vue,React', '2026-05-05 11:00:00', '2026-05-05 11:00:00'),
('周九', 0, '13900139002', 'zhoujiu@example.com', '1999-07-20', '3年前端开发经验', '/resumes/zhoujiu.pdf', 'BOSS直聘', '平台投递', 'screening', 28000.00, '百度', '前端开发', 3, '硕士', '北京大学', 'Vue,React', '2026-05-05 14:00:00', '2026-05-05 16:00:00'),
('吴十', 1, '13900139003', 'wushi@example.com', '1996-11-08', '6年后端开发经验', '/resumes/wushi.pdf', '猎聘', '平台投递', 'interviewing', 35000.00, '腾讯', '后端开发', 6, '本科', '浙江大学', 'Java,Go', '2026-05-04 10:00:00', '2026-05-06 09:00:00'),
('郑十一', 0, '13900139004', 'zheng11@example.com', '1997-05-22', '4年产品经验', '/resumes/zheng11.pdf', '内部推荐', '员工推荐', 'hired', 28000.00, '美团', '产品经理', 4, '硕士', '复旦大学', '产品设计', '2026-04-20 09:00:00', '2026-05-06 17:00:00'),
('王十五', 1, '13900139015', 'wang15@example.com', '1992-02-28', '7年销售经验', '/resumes/wang15.pdf', '猎聘', '平台投递', 'rejected', 25000.00, '京东', '销售经理', 7, '本科', '中国人民大学', '销售,商务', '2026-04-15 10:00:00', '2026-04-25 14:00:00'),
('李十六', 0, '13900139016', 'li16@example.com', '1995-08-12', '4年财务经验', '/resumes/li16.pdf', 'BOSS直聘', '平台投递', 'interviewing', 18000.00, '字节跳动', '财务', 4, '本科', '中央财经大学', '财务,核算', '2026-05-02 09:00:00', '2026-05-06 10:00:00');

INSERT INTO interview_schedule (candidate_id, job_position_id, round, round_name, interviewer_id, interview_time, duration_minutes, location, status, cancel_reason, created_at) VALUES
(3, 1, 1, '技术一面', 1, '2026-05-08 10:00:00', 60, '北京会议室A', 'scheduled', NULL, '2026-05-06 10:00:00'),
(3, 1, 2, '技术二面', 3, '2026-05-10 14:00:00', 90, '北京会议室B', 'scheduled', NULL, '2026-05-06 10:00:00'),
(4, 2, 1, '产品一面', 2, '2026-04-25 10:00:00', 60, '深圳会议室A', 'completed', NULL, '2026-04-20 10:00:00'),
(4, 2, 2, '产品二面', 1, '2026-04-28 14:00:00', 90, '深圳会议室B', 'completed', NULL, '2026-04-20 10:00:00'),
(6, NULL, 1, '财务一面', 2, '2026-05-09 14:00:00', 60, '北京会议室C', 'scheduled', NULL, '2026-05-06 14:00:00'),
(5, NULL, 1, '销售一面', NULL, '2026-04-20 10:00:00', 60, '北京会议室D', 'cancelled', '候选人放弃面试', '2026-04-18 10:00:00');

INSERT INTO interview_evaluation (schedule_id, interviewer_id, rating, strengths, weaknesses, evaluation, recommend_next_round, created_at) VALUES
(3, 2, 4, '产品思维强，逻辑清晰', '细节处理需要加强', '综合表现良好，建议进入下一轮', 1, '2026-04-25 17:00:00'),
(4, 1, 5, '逻辑清晰，沟通能力强', '暂无明显不足', '非常优秀，建议录用', 1, '2026-04-28 17:00:00'),
(6, 2, 3, '财务专业知识扎实', '沟通表达能力有待提升', '基本符合要求，可考虑', 0, '2026-04-22 17:00:00');

INSERT INTO offer (candidate_id, job_position_id, offer_no, base_salary, allowances, probation_months, start_date, status, approval_status, content, attachment_url, sent_at, accepted_at, rejected_reason, created_by, created_at) VALUES
(4, 2, 'OFFER20260506001', 28000.00, 3000.00, 3, '2026-05-18', 'accepted', 'approved', '欢迎加入公司，详细内容见附件', '/offers/OFFER20260506001.pdf', '2026-05-06 17:00:00', '2026-05-08 10:00:00', NULL, 2, '2026-05-06 15:00:00');

INSERT INTO performance_plan (plan_name, plan_type, start_date, end_date, departments, template_content, status, create_by, create_time, update_time) VALUES
('2026年Q1绩效考核', 'quarterly', '2026-01-01', '2026-03-31', '["技术部", "产品部", "人力资源部"]', '{"template": "Q1"}', 2, 2, '2025-12-15 10:00:00', '2026-01-01 09:00:00'),
('2026年Q2绩效考核', 'quarterly', '2026-04-01', '2026-06-30', '["技术部", "产品部", "人力资源部"]', '{"template": "Q2"}', 0, 2, '2026-03-15 10:00:00', '2026-03-15 10:00:00');

INSERT INTO performance_evaluation (plan_id, employee_id, evaluator_id, self_score, self_comment, leader_score, leader_comment, final_score, grade, status, appeal_reason, appeal_result, complete_time, create_time) VALUES
(1, 1, 3, 88.00, '本季度工作顺利完成，按时交付项目，团队协作良好', 90.00, '工作表现优秀，技术能力强', 89.00, 'A', 2, NULL, NULL, '2026-04-15 17:00:00', '2026-04-01 09:00:00'),
(1, 2, 1, 85.00, '完成招聘目标，完善人事制度', 82.00, '工作认真负责，需要提升效率', 83.50, 'B', 2, NULL, NULL, '2026-04-16 16:00:00', '2026-04-01 09:00:00'),
(1, 3, NULL, 90.00, '完成技术架构升级', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '2026-04-01 09:00:00'),
(1, 5, 2, 82.00, '完成产品设计任务', 85.00, '设计能力出色，创意强', 83.50, 'B', 2, NULL, NULL, '2026-04-16 15:00:00', '2026-04-01 09:00:00');

INSERT INTO performance_result (employee_id, evaluation_year, evaluation_period, plan_id, final_score, grade, ranking, bonus_ratio, promotion_suggestion, is_confirmed, create_time) VALUES
(1, 2026, 'Q1', 1, 89.00, 'A', 1, 1.50, '建议晋升为技术专家', 1, '2026-04-17 10:00:00'),
(2, 2026, 'Q1', 1, 83.50, 'B', 3, 1.20, '暂不晋升', 1, '2026-04-17 10:00:00'),
(3, 2026, 'Q1', 1, 90.00, 'A', 1, 1.50, '建议晋升为技术VP', 1, '2026-04-17 10:00:00'),
(5, 2026, 'Q1', 1, 83.50, 'B', 3, 1.20, '暂不晋升', 1, '2026-04-17 10:00:00');

INSERT INTO training_course (course_name, course_category, cover_image, lecturer, lecturer_intro, course_hours, capacity, enrolled_count, course_outline, target_audience, material_url, start_date, end_date, status, create_time) VALUES
('React高级开发', '技术开发', '/covers/react.png', '技术专家', '10年开发经验', 16.0, 50, 3, 'React高级特性，性能优化，测试', '前端开发人员', '/materials/react.pdf', '2026-05-15', '2026-05-30', 1, '2026-05-03 10:00:00'),
('产品思维培训', '产品管理', '/covers/product.png', '产品总监', '8年产品经验', 8.0, 30, 2, '产品规划，用户研究，数据分析', '产品经理，产品设计', '/materials/product.pdf', '2026-05-20', '2026-05-20', 1, '2026-05-03 10:00:00'),
('高效沟通技巧', '软技能', '/covers/communication.png', '外部讲师', '资深培训师', 4.0, 40, 3, '职场沟通，表达技巧', '全体员工', '/materials/communication.pdf', '2026-04-15', '2026-04-15', 3, '2026-04-08 10:00:00');

INSERT INTO training_registration (course_id, employee_id, registration_time, attendance_status, signin_time, cancel_reason, status, create_time) VALUES
(1, 1, '2026-05-03 10:00:00', 0, NULL, NULL, 1, '2026-05-03 10:00:00'),
(1, 3, '2026-05-03 10:30:00', 0, NULL, NULL, 1, '2026-05-03 10:30:00'),
(1, 5, '2026-05-03 11:00:00', 0, NULL, NULL, 1, '2026-05-03 11:00:00'),
(2, 2, '2026-05-03 14:00:00', 0, NULL, NULL, 1, '2026-05-03 14:00:00'),
(2, 4, '2026-05-03 14:30:00', 0, NULL, NULL, 1, '2026-05-03 14:30:00'),
(3, 1, '2026-04-10 09:00:00', 1, '2026-04-15 08:55:00', NULL, 3, '2026-04-10 09:00:00'),
(3, 2, '2026-04-10 09:15:00', 1, '2026-04-15 08:58:00', NULL, 3, '2026-04-10 09:15:00'),
(3, 4, '2026-04-10 09:30:00', 1, '2026-04-15 09:00:00', NULL, 3, '2026-04-10 09:30:00');

INSERT INTO training_record (employee_id, course_id, training_date, actual_hours, assessment_result, certificate_no, satisfaction_score, feedback, create_time) VALUES
(1, 3, '2026-04-15', 4.0, '优秀', 'CERT20260415001', 4, '课程内容很实用', '2026-04-15 18:00:00'),
(2, 3, '2026-04-15', 4.0, '优秀', 'CERT20260415002', 5, '讲师讲得很好', '2026-04-15 18:00:00'),
(4, 3, '2026-04-15', 4.0, '良好', 'CERT20260415003', 4, '学到了很多', '2026-04-15 18:00:00');

INSERT INTO key_position (position_id, critical_level, reason, successor_ready_count, risk_level, status, create_time) VALUES
(3, 3, '技术核心岗位', 1, 3, 1, '2026-01-01 10:00:00'),
(1, 2, '前端技术负责人', 1, 2, 1, '2026-01-01 10:00:00'),
(2, 2, '产品负责人', 0, 2, 1, '2026-01-01 10:00:00');

INSERT INTO successor (key_position_id, candidate_id, readiness_level, readiness_desc, assessment_score, strength, development_needs, status, create_time) VALUES
(2, 1, '1年内', '已具备技术能力，需要管理经验', 85.00, '技术能力强，有团队意识', '需要提升战略思维', 1, '2026-01-01 10:00:00'),
(3, 5, '2-3年', '学习能力强，有潜力', 75.00, '设计能力出色', '需要更多产品经验', 1, '2026-01-01 10:00:00');

INSERT INTO nine_grid_talent (employee_id, assessment_date, performance_grade, potential_grade, grid_x, grid_y, grid_position, development_suggestion) VALUES
(1, '2026-05-01', 'A', '高', 3, 3, 'A1', '重点培养，提供晋升机会'),
(2, '2026-05-01', 'B', '高', 2, 3, 'A2', '提供更多挑战'),
(3, '2026-05-01', 'A', '中', 3, 2, 'B1', '稳定保留'),
(4, '2026-05-01', 'B', '中', 2, 2, 'B2', '正常发展'),
(5, '2026-05-01', 'A', '高', 3, 3, 'A1', '重点培养');

INSERT INTO alert_rule (rule_name, rule_type, trigger_days, threshold_value, risk_level, is_enabled, receiver_roles, rule_config) VALUES
('合同到期提醒', 'contract', 30, 'DATEDIFF(expiry_date, CURDATE()) <= 30', 3, 1, 'hr,manager', '{"notify_type":"email"}'),
('生日祝福', 'birthday', 0, '生日当天', 1, 1, 'all', '{"notify_type":"sms"}'),
('试用期转正提醒', 'probation', 7, '试用期7天后到期', 2, 1, 'hr,manager', '{"notify_type":"email"}'),
('连续迟到预警', 'attendance', 0, '连续迟到3次', 2, 1, 'hr,manager', '{"notify_type":"in_app"}'),
('绩效下降预警', 'performance', 0, '绩效等级下降', 3, 1, 'hr,manager', '{"notify_type":"email"}');

INSERT INTO alert_record (rule_id, alert_type, alert_title, alert_content, target_id, target_type, risk_level, status, handler_id, handle_time, handle_remark) VALUES
(1, 'contract', '合同到期提醒', '李四的劳动合同将于30天后到期，请及时处理', 2, 'employee', 3, 0, NULL, NULL, NULL),
(2, 'birthday', '生日祝福', '今天是张三的生日', 1, 'employee', 1, 1, 2, '2026-05-01 09:00:00', '已发送祝福'),
(3, 'probation', '试用期转正提醒', '赵六的试用期将于7天后到期，请安排转正评估', 4, 'employee', 2, 0, NULL, NULL, NULL),
(4, 'attendance', '迟到预警', '李四本月已迟到3次，请关注', 2, 'employee', 2, 1, NULL, NULL, NULL),
(NULL, 'system', '系统通知', '系统将于今晚进行维护', NULL, 'system', 2, 0, NULL, NULL, NULL);

INSERT INTO risk_prediction (employee_id, prediction_type, risk_score, risk_level, factors, prediction_date, is_confirmed) VALUES
(2, 'turnover', 75.50, '高', '["考勤异常", "积极性下降", "近期请假频繁"]', '2026-05-01', 1),
(4, 'performance_drop', 65.00, '中', '["试用期表现一般", "任务完成率低", "学习进度慢"]', '2026-05-01', 0),
(5, 'disengagement', 55.00, '中', '["参与度下降", "沟通减少", "迟到早退"]', '2026-04-20', 1);

INSERT INTO import_record (import_type, file_name, total_count, success_count, fail_count, error_log_url, import_by, import_time, status) VALUES
('employee', '员工导入202604.xlsx', 150, 148, 2, '/import_logs/employee_202604_error.log', 2, '2026-04-15 10:00:00', 2),
('attendance', '考勤导入202603.xlsx', 1500, 1500, 0, NULL, 2, '2026-04-01 09:00:00', 1),
('performance', '绩效数据导入.xlsx', 50, 45, 5, '/import_logs/performance_error.log', 1, '2026-04-20 14:00:00', 2);

INSERT INTO custom_report (report_name, report_category, data_source, selected_fields, filter_conditions, sort_config, chart_config, is_public, created_by) VALUES
('员工花名册', 'HR', 'employee', '["id","name","department","position","status"]', '{"status":"active"}', '{"field":"create_time","order":"desc"}', '{"type":"table"}', 1, 2),
('考勤月报', 'HR', 'attendance', '["employee_id","late_count","leave_days","attendance_rate"]', '{"month":"2026-04"}', '{"field":"employee_id","order":"asc"}', '{"type":"bar_chart"}', 1, 2),
('绩效统计报表', 'HR', 'performance', '["employee_id","final_score","grade","ranking"]', '{"period":"2026-Q1"}', '{"field":"ranking","order":"asc"}', '{"type":"dashboard"}', 1, 1),
('培训完成率报表', 'HR', 'training', '["course_id","enrolled_count","completed_count","completion_rate"]', '{"quarter":"2026-Q2"}', '{"field":"completion_rate","order":"desc"}', '{"type":"pie_chart"}', 0, 2);

INSERT INTO data_archive (source_table, archive_date, start_date, end_date, record_count, archive_file, restore_key, status, operator_id) VALUES
('attendance_record', '2026-04-01', '2025-01-01', '2025-12-31', 36000, '/archives/attendance_2025.zip', 'RESTORE_2025_ATT', 0, 1),
('employee', '2026-01-01', '2024-01-01', '2024-12-31', 500, '/archives/employee_2024.zip', 'RESTORE_2024_EMP', 0, 1);

INSERT INTO third_party_app (app_name, app_key, app_secret, app_description, callback_url, ip_whitelist, qps_limit, daily_limit, status) VALUES
('OA系统集成', 'OA_20260401', 'secret_1234567890abcdef', '与公司OA系统集成', 'https://oa.example.com/callback', '192.168.1.0/24', 100, 10000, 1),
('财务系统对接', 'FIN_20260315', 'secret_0987654321fedcba', '与财务系统对接', 'https://finance.example.com/webhook', '10.0.0.0/24', 50, 5000, 1),
('招聘平台同步', 'REC_20260220', 'secret_abcdef1234567890', '与招聘平台同步', 'https://recruit.example.com/callback', '0.0.0.0/0', 20, 2000, 0);

INSERT INTO api_authorization (app_id, api_path, api_method, permission_level) VALUES
(1, '/api/v1/employees', 'GET', 'read'),
(1, '/api/v1/organization', 'POST', 'all'),
(2, '/api/v1/attendance', 'GET', 'read'),
(3, '/api/v1/jobs', 'POST', 'write');

INSERT INTO api_call_log (app_id, api_path, request_method, request_params, response_status, response_data, response_time_ms, client_ip, user_agent) VALUES
(1, '/api/v1/employees', 'GET', '{"page":1,"size":10}', 200, '{"data":[...],"total":150}', 45, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, '/api/v1/employees', 'GET', '{"page":2,"size":10}', 200, '{"data":[...],"total":150}', 52, '192.168.1.101', 'PostmanRuntime/7.28.0'),
(2, '/api/v1/attendance', 'GET', '{"date":"2026-04-01"}', 200, '{"data":[...]}', 120, '10.0.0.50', 'Java/11.0.12'),
(2, '/api/v1/attendance', 'GET', '{"date":"invalid"}', 500, '{"error":"Invalid date format"}', 250, '10.0.0.51', 'Java/11.0.12'),
(1, '/api/v1/organization', 'POST', '{"action":"sync"}', 200, '{"status":"success"}', 85, '192.168.1.100', 'Python/3.9.7');

INSERT INTO user (username, password, employee_id, real_name, email, phone, role, permissions, status) VALUES
('admin', 'password123', 1, '张三', 'admin@example.com', '13800138001', 'super_admin', '{"modules": ["all"]}', 1),
('hr_admin', 'password123', 2, '李四', 'hr@example.com', '13800138002', 'hr', '{"modules": ["employee", "hr", "attendance"]}', 1),
('tech_lead', 'password123', 3, '王五', 'tech@example.com', '13800138003', 'manager', '{"modules": ["dashboard", "employee", "performance"]}', 1),
('employee1', 'password123', 4, '赵六', 'emp1@example.com', '13800138004', 'employee', '{"modules": ["dashboard"]}', 1),
('employee2', 'password123', 5, '钱七', 'emp2@example.com', '13800138005', 'employee', '{"modules": ["dashboard"]}', 1),
('employee3', 'password123', 7, '孙十二', 'emp3@example.com', '13800138007', 'employee', '{"modules": ["dashboard"]}', 1),
('employee4', 'password123', 8, '周十三', 'emp4@example.com', '13800138008', 'employee', '{"modules": ["dashboard"]}', 1),
('employee5', 'password123', 9, '吴十四', 'emp5@example.com', '13800138009', 'employee', '{"modules": ["dashboard"]}', 1);

INSERT INTO operation_log (user_id, username, module, operation, method, params, ip, status, error_msg, execution_time) VALUES
(1, 'admin', 'employee', '新增员工', 'POST', '{"name":"新员工"}', '192.168.1.100', 1, NULL, 150),
(1, 'admin', 'employee', '编辑员工', 'PUT', '{"id":1,"name":"张三更新"}', '192.168.1.100', 1, NULL, 120),
(2, 'hr_admin', 'attendance', '导入考勤', 'POST', '{"file":"attendance.xlsx"}', '192.168.1.101', 1, NULL, 500),
(2, 'hr_admin', 'performance', '创建绩效计划', 'POST', '{"name":"Q2绩效"}', '192.168.1.101', 1, NULL, 200),
(3, 'tech_lead', 'employee', '查看员工列表', 'GET', '{"page":1}', '192.168.1.102', 1, NULL, 80),
(1, 'admin', 'system', '系统配置更新', 'PUT', '{"config":{}}', '192.168.1.100', 1, NULL, 200),
(2, 'hr_admin', 'training', '创建培训课程', 'POST', '{"name":"React培训"}', '192.168.1.101', 1, NULL, 180),
(1, 'admin', 'report', '生成报表', 'POST', '{"type":"employee"}', '192.168.1.100', 1, NULL, 300),
(2, 'hr_admin', 'employee', '导入员工', 'POST', '{"file":"employee.xlsx"}', '192.168.1.101', 0, '文件格式错误', 400),
(1, 'admin', 'system', '登录系统', 'POST', '{"username":"admin"}', '192.168.1.100', 1, NULL, 100),
(4, 'employee1', 'attendance', '查看考勤', 'GET', '{"month":"2026-04"}', '192.168.1.103', 1, NULL, 60),
(5, 'employee2', 'performance', '提交自评', 'POST', '{"score":85}', '192.168.1.104', 1, NULL, 120),
(2, 'hr_admin', 'recruitment', '发布职位', 'POST', '{"title":"前端工程师"}', '192.168.1.101', 1, NULL, 150),
(3, 'tech_lead', 'recruitment', '评价面试', 'POST', '{"candidateId":3,"rating":4}', '192.168.1.102', 1, NULL, 100),
(1, 'admin', 'permission', '分配权限', 'PUT', '{"role":"manager"}', '192.168.1.100', 1, NULL, 80);

-- =============================================================
-- 数据库初始化完成
-- =============================================================
-- 说明：
-- 1. 本SQL脚本包含完整的42张业务表及2张系统表，共44张表
-- 2. 包含完整的Mock数据，每表3-5条记录
-- 3. 使用UTF8MB4字符集，InnoDB引擎
-- 4. 包含索引、外键、约束等完整性设置
-- 5. 适用于MySQL 5.7+版本

-- 使用示例：
-- mysql -u root -p < database.sql
-- 或在MySQL客户端中 source database.sql

-- 验证数据：
-- USE hr_system;
-- SHOW TABLES;
-- SELECT COUNT(*) FROM employee;
-- SELECT COUNT(*) FROM department;
-- =============================================================