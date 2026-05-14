-- 岗位说明书数据库扩库脚本
-- 执行前请先备份数据库

-- 创建岗位说明书主表
CREATE TABLE IF NOT EXISTS `hr_position_description` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `position_id` INT COMMENT '岗位ID，关联position表',
    `position_code` VARCHAR(50) COMMENT '岗位编码',
    `position_name` VARCHAR(100) NOT NULL COMMENT '岗位名称',
    `job_title` VARCHAR(50) COMMENT '职务名称',
    `level` VARCHAR(20) COMMENT '职级',
    `department` VARCHAR(100) COMMENT '所属部门',
    `dept_type` VARCHAR(50) COMMENT '部门类型',
    `dept_nature` VARCHAR(50) COMMENT '部门性质',
    `supervisor` VARCHAR(100) COMMENT '直属上级',
    `cross_supervisor` VARCHAR(100) COMMENT '跨级上级',
    `direct_subordinates` INT DEFAULT 0 COMMENT '直接下属人数',
    `indirect_subordinates` INT DEFAULT 0 COMMENT '间接下属人数',
    `promotion_direction` VARCHAR(100) COMMENT '晋升方向',
    `rotation_position` VARCHAR(100) COMMENT '轮岗岗位',
    `effective_date` DATE COMMENT '生效日期',
    `approver` VARCHAR(100) COMMENT '审批人',
    `headcount` INT DEFAULT 1 COMMENT '编制人数',
    `summary` TEXT COMMENT '职位概述',
    `purpose` TEXT COMMENT '岗位设置目的',
    `work_time` VARCHAR(100) COMMENT '工作时间',
    `work_place` VARCHAR(200) COMMENT '工作场所',
    `work_env` VARCHAR(100) COMMENT '工作环境',
    `risk_level` VARCHAR(20) COMMENT '危险性等级',
    `occupational_hazard` VARCHAR(200) COMMENT '职业病危害因素',
    `documents` TEXT COMMENT '台账/文件签发与主持',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_position_id` (`position_id`),
    INDEX `idx_position_code` (`position_code`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位说明书主表';

-- 创建岗位职责明细表
CREATE TABLE IF NOT EXISTS `hr_position_duty` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `position_desc_id` INT NOT NULL COMMENT '岗位说明书ID，关联hr_position_description表',
    `module` VARCHAR(50) COMMENT '职责模块',
    `category` VARCHAR(50) COMMENT '职责分类',
    `work_type` VARCHAR(20) DEFAULT '核心' COMMENT '工作分类：核心、重点、基础',
    `detail` TEXT COMMENT '职责细则',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_position_desc_id` (`position_desc_id`),
    INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位职责明细表';

-- 创建任职资格表
CREATE TABLE IF NOT EXISTS `hr_position_qualification` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `position_desc_id` INT NOT NULL COMMENT '岗位说明书ID，关联hr_position_description表',
    `education` VARCHAR(200) COMMENT '教育背景要求',
    `training` VARCHAR(200) COMMENT '培训经历要求',
    `experience` VARCHAR(200) COMMENT '工作经验要求',
    `skills` VARCHAR(200) COMMENT '技能要求',
    `other_requirements` TEXT COMMENT '其他要求',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_position_desc_id` (`position_desc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任职资格表';

-- 创建考核指标表
CREATE TABLE IF NOT EXISTS `hr_position_metric` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `position_desc_id` INT NOT NULL COMMENT '岗位说明书ID，关联hr_position_description表',
    `dimension` VARCHAR(50) COMMENT '考核维度',
    `metric` VARCHAR(100) COMMENT '核心指标',
    `standard` VARCHAR(100) COMMENT '量化标准',
    `source` VARCHAR(100) COMMENT '数据来源',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_position_desc_id` (`position_desc_id`),
    INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核指标表';

-- 插入示例数据
INSERT INTO `hr_position_description` (
    `position_code`, `position_name`, `job_title`, `level`, `department`,
    `dept_type`, `dept_nature`, `supervisor`, `direct_subordinates`, `indirect_subordinates`,
    `promotion_direction`, `effective_date`, `approver`, `headcount`, `summary`, `purpose`,
    `work_time`, `work_place`, `work_env`, `risk_level`, `occupational_hazard`, `documents`, `status`
) VALUES
(
    'HR-DIR-001', '人力资源总监', '总监', 'M4', '人力资源部',
    '职能部门', '管理部门', 'CEO', 5, 25,
    '高管层', '2024-01-01', 'CEO', 1,
    '全面负责人力资源管理工作，制定并执行公司人力资源战略，优化人力资源管理体系，提升组织效能和员工满意度。',
    '建立和完善公司人力资源管理体系，确保公司人才供给和发展，支持公司战略目标的实现。',
    '周一至周五，9:00-18:00', '公司总部', '办公室环境', '低', '无',
    '负责审批人力资源相关制度文件，签发招聘计划、培训计划、薪酬调整方案等重要文件。', 1
),
(
    'HR-MGR-001', '人力资源经理', '经理', 'M2', '人力资源部',
    '职能部门', '管理部门', '人力资源总监', 3, 0,
    '人力资源总监', '2024-06-01', '人力资源总监', 1,
    '负责人力资源日常管理工作，包括招聘、培训、绩效、员工关系等模块，确保各项人力资源工作有序开展。',
    '执行人力资源战略，负责日常人力资源管理事务，支持业务部门发展需求。',
    '周一至周五，9:00-18:00', '公司总部', '办公室环境', '低', '无',
    '负责起草人力资源相关文件，处理员工档案管理工作。', 1
),
(
    'HR-REC-001', '招聘专员', '专员', 'P3', '人力资源部',
    '职能部门', '业务部门', '人力资源经理', 0, 0,
    '人力资源主管', '2025-01-01', '人力资源经理', 2,
    '负责公司招聘工作，发布招聘信息，筛选简历，组织面试，完成招聘任务。',
    '为公司各部门提供合格的人才支持，确保招聘目标的实现。',
    '周一至周五，9:00-18:00', '公司总部', '办公室环境', '低', '无',
    '负责招聘相关文档的整理和归档工作。', 1
),
(
    'HR-TRN-001', '培训专员', '专员', 'P3', '人力资源部',
    '职能部门', '业务部门', '人力资源经理', 0, 0,
    '培训主管', '2025-03-01', '人力资源经理', 1,
    '负责公司培训体系建设和培训活动组织实施，提升员工能力和绩效。',
    '构建完善的培训体系，为员工提供持续学习和发展的机会。',
    '周一至周五，9:00-18:00', '公司总部', '办公室环境', '低', '无',
    '负责培训相关文档的管理和归档工作。', 1
),
(
    'HR-PER-001', '绩效专员', '专员', 'P3', '人力资源部',
    '职能部门', '业务部门', '人力资源经理', 0, 0,
    '绩效主管', '2025-02-01', '人力资源经理', 1,
    '负责公司绩效考核体系的实施和维护，确保绩效考核工作公正、公平、公开。',
    '建立科学的绩效考核体系，激励员工提升绩效，支持公司目标的实现。',
    '周一至周五，9:00-18:00', '公司总部', '办公室环境', '低', '无',
    '负责绩效考核相关文档的管理和归档工作。', 1
);

-- 插入人力资源总监的岗位职责
INSERT INTO `hr_position_duty` (`position_desc_id`, `module`, `category`, `work_type`, `detail`, `sort_order`) VALUES
(1, '战略规划', '人力资源战略', '核心', '制定公司人力资源战略规划，确保与公司整体战略一致', 1),
(1, '组织管理', '组织架构', '核心', '设计和优化组织架构，提升组织效率', 2),
(1, '人才管理', '人才招聘', '重点', '领导人才招聘工作，建立人才储备体系', 3),
(1, '绩效管理', '绩效体系', '核心', '建立和完善绩效考核体系，推动绩效文化', 4),
(1, '薪酬福利', '薪酬体系', '重点', '设计和管理薪酬福利体系，确保外部竞争力和内部公平性', 5);

-- 插入人力资源经理的岗位职责
INSERT INTO `hr_position_duty` (`position_desc_id`, `module`, `category`, `work_type`, `detail`, `sort_order`) VALUES
(2, '招聘管理', '招聘执行', '核心', '组织实施招聘工作，筛选候选人，协调面试安排', 1),
(2, '培训发展', '培训计划', '重点', '制定年度培训计划，组织实施各类培训活动', 2),
(2, '绩效管理', '绩效执行', '核心', '组织绩效考核工作，跟进绩效结果应用', 3),
(2, '员工关系', '员工关怀', '基础', '处理员工咨询和投诉，组织员工活动', 4),
(2, '人事事务', '日常管理', '基础', '办理员工入职、离职、调岗等手续', 5);

-- 插入招聘专员的岗位职责
INSERT INTO `hr_position_duty` (`position_desc_id`, `module`, `category`, `work_type`, `detail`, `sort_order`) VALUES
(3, '招聘执行', '职位发布', '核心', '发布招聘信息，维护招聘渠道', 1),
(3, '简历筛选', '候选人筛选', '核心', '筛选简历，进行初步面试', 2),
(3, '面试协调', '面试安排', '重点', '协调面试时间，安排面试流程', 3),
(3, 'offer管理', '录用流程', '重点', '发放录用通知，跟进入职', 4);

-- 插入培训专员的岗位职责
INSERT INTO `hr_position_duty` (`position_desc_id`, `module`, `category`, `work_type`, `detail`, `sort_order`) VALUES
(4, '培训规划', '需求分析', '核心', '开展培训需求调研，制定培训计划', 1),
(4, '培训实施', '课程组织', '核心', '组织各类培训课程，协调师资资源', 2),
(4, '培训评估', '效果评估', '重点', '评估培训效果，跟踪培训转化', 3),
(4, '知识管理', '课件开发', '基础', '开发和维护培训课件', 4);

-- 插入绩效专员的岗位职责
INSERT INTO `hr_position_duty` (`position_desc_id`, `module`, `category`, `work_type`, `detail`, `sort_order`) VALUES
(5, '绩效体系', '制度维护', '核心', '维护绩效考核制度，更新考核标准', 1),
(5, '绩效执行', '考核组织', '核心', '组织绩效考核工作，收集考核数据', 2),
(5, '绩效分析', '数据统计', '重点', '分析绩效考核结果，提供改进建议', 3),
(5, '绩效沟通', '反馈跟进', '重点', '协助绩效面谈，跟进改进计划', 4);

-- 插入人力资源总监的任职资格
INSERT INTO `hr_position_qualification` (`position_desc_id`, `education`, `training`, `experience`, `skills`, `other_requirements`) VALUES
(1, '本科及以上学历，人力资源管理、工商管理等相关专业', '人力资源管理培训、领导力培训、战略规划培训', '10年以上人力资源管理经验，5年以上管理岗位经验，具备战略思维和领导力', '精通人力资源各模块管理，熟悉劳动法律法规，优秀的沟通协调能力和团队管理能力', '具备良好的职业道德和保密意识，能够承受较大工作压力');

-- 插入人力资源经理的任职资格
INSERT INTO `hr_position_qualification` (`position_desc_id`, `education`, `training`, `experience`, `skills`, `other_requirements`) VALUES
(2, '本科及以上学历，人力资源管理、心理学等相关专业', '人力资源管理培训、劳动法培训、绩效管理培训', '5年以上人力资源管理经验，熟悉人力资源各模块工作', '良好的沟通能力、组织协调能力、问题解决能力', '具备团队合作精神，工作细致认真');

-- 插入招聘专员的任职资格
INSERT INTO `hr_position_qualification` (`position_desc_id`, `education`, `training`, `experience`, `skills`, `other_requirements`) VALUES
(3, '本科及以上学历，人力资源、心理学等相关专业', '招聘技巧培训、面试技巧培训', '2年以上招聘工作经验', '良好的沟通能力、判断力、执行力', '具备团队合作精神，工作积极主动');

-- 插入培训专员的任职资格
INSERT INTO `hr_position_qualification` (`position_desc_id`, `education`, `training`, `experience`, `skills`, `other_requirements`) VALUES
(4, '本科及以上学历，教育、人力资源等相关专业', '培训管理培训、课程设计培训', '2年以上培训工作经验', '良好的组织协调能力、表达能力、学习能力', '具备创新意识，善于沟通');

-- 插入绩效专员的任职资格
INSERT INTO `hr_position_qualification` (`position_desc_id`, `education`, `training`, `experience`, `skills`, `other_requirements`) VALUES
(5, '本科及以上学历，人力资源、统计学等相关专业', '绩效管理培训、数据分析培训', '2年以上绩效管理经验', '良好的数据分析能力、沟通能力、保密意识', '工作细致认真，具备较强的逻辑思维');

-- 插入人力资源总监的考核指标
INSERT INTO `hr_position_metric` (`position_desc_id`, `dimension`, `metric`, `standard`, `source`, `sort_order`) VALUES
(1, '人才管理', '核心人才保有率', '≥95%', 'HR系统', 1),
(1, '招聘效能', '招聘周期', '≤30天', '招聘系统', 2),
(1, '绩效体系', '绩效完成率', '≥90%', '绩效系统', 3),
(1, '员工满意度', '满意度得分', '≥85分', '调研系统', 4);

-- 插入人力资源经理的考核指标
INSERT INTO `hr_position_metric` (`position_desc_id`, `dimension`, `metric`, `standard`, `source`, `sort_order`) VALUES
(2, '招聘效率', '招聘完成率', '≥95%', '招聘系统', 1),
(2, '培训效果', '培训完成率', '≥90%', '培训系统', 2),
(2, '员工满意度', '员工投诉处理及时率', '100%', 'HR系统', 3);

-- 插入招聘专员的考核指标
INSERT INTO `hr_position_metric` (`position_desc_id`, `dimension`, `metric`, `standard`, `source`, `sort_order`) VALUES
(3, '招聘效率', '简历筛选及时率', '≥95%', '招聘系统', 1),
(3, '招聘质量', '试用期通过率', '≥85%', 'HR系统', 2);

-- 插入培训专员的考核指标
INSERT INTO `hr_position_metric` (`position_desc_id`, `dimension`, `metric`, `standard`, `source`, `sort_order`) VALUES
(4, '培训覆盖', '员工培训学时', '≥40小时/人/年', '培训系统', 1),
(4, '培训效果', '培训满意度', '≥85分', '调研系统', 2);

-- 插入绩效专员的考核指标
INSERT INTO `hr_position_metric` (`position_desc_id`, `dimension`, `metric`, `standard`, `source`, `sort_order`) VALUES
(5, '绩效周期', '考核完成及时率', '100%', '绩效系统', 1),
(5, '考核质量', '考核申诉率', '≤5%', 'HR系统', 2);

SELECT '岗位说明书数据库扩库完成！' AS message;
