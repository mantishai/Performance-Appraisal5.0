USE hr_system;

-- 添加 employee_no 字段（关联工号，员工用户有值，非员工为NULL）
ALTER TABLE user 
ADD COLUMN IF NOT EXISTS employee_no VARCHAR(20) DEFAULT NULL COMMENT '关联工号（员工用户有值，非员工为NULL）';

-- 添加 display_name 字段（显示名称）
ALTER TABLE user 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50) NOT NULL DEFAULT '' COMMENT '显示名称';

-- 添加索引
ALTER TABLE user ADD INDEX IF NOT EXISTS idx_employee_no (employee_no);

-- 更新现有数据的 display_name
UPDATE user SET display_name = COALESCE(real_name, username) WHERE display_name = '';

-- 给admin用户设置display_name
UPDATE user SET display_name = '管理员' WHERE username = 'admin';

-- 更新现有员工用户的 employee_no
UPDATE user u
JOIN employee e ON u.employee_id = e.id
SET u.employee_no = e.employee_no
WHERE u.employee_id IS NOT NULL;

SELECT '用户表更新完成' AS message;
