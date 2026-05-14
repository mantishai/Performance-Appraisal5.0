-- 岗位说明书更新脚本：为现有数据设置 position_id
-- 假设 position 表中有相应的岗位记录

-- 更新岗位说明书的 position_id（根据岗位名称匹配）
UPDATE hr_position_description 
SET position_id = (SELECT id FROM position WHERE name = '人力资源总监' LIMIT 1)
WHERE position_name = '人力资源总监' AND position_id IS NULL;

UPDATE hr_position_description 
SET position_id = (SELECT id FROM position WHERE name = '人力资源经理' LIMIT 1)
WHERE position_name = '人力资源经理' AND position_id IS NULL;

UPDATE hr_position_description 
SET position_id = (SELECT id FROM position WHERE name = '招聘专员' LIMIT 1)
WHERE position_name = '招聘专员' AND position_id IS NULL;

UPDATE hr_position_description 
SET position_id = (SELECT id FROM position WHERE name = '培训专员' LIMIT 1)
WHERE position_name = '培训专员' AND position_id IS NULL;

UPDATE hr_position_description 
SET position_id = (SELECT id FROM position WHERE name = '绩效专员' LIMIT 1)
WHERE position_name = '绩效专员' AND position_id IS NULL;

SELECT '岗位说明书 position_id 更新完成！' AS message;
