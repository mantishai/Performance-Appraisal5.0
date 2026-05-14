import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// 通过岗位ID获取岗位说明书
router.get('/by-position/:positionId', async (req, res) => {
    try {
        const { positionId } = req.params;
        
        const [rows] = await pool.execute(`
            SELECT * FROM hr_position_description
            WHERE position_id = ? AND status = 1
            LIMIT 1
        `, [positionId]);
        
        if (rows.length === 0) {
            return res.json({ code: 404, message: '未找到对应的岗位说明书' });
        }
        
        const mainInfo = rows[0];
        
        const [dutyRows] = await pool.execute(`
            SELECT * FROM hr_position_duty 
            WHERE position_desc_id = ? 
            ORDER BY sort_order ASC
        `, [mainInfo.id]);
        
        const [qualificationRows] = await pool.execute(`
            SELECT * FROM hr_position_qualification 
            WHERE position_desc_id = ?
        `, [mainInfo.id]);
        
        const [metricRows] = await pool.execute(`
            SELECT * FROM hr_position_metric 
            WHERE position_desc_id = ? 
            ORDER BY sort_order ASC
        `, [mainInfo.id]);
        
        const result = {
            ...mainInfo,
            duties: dutyRows.map(d => ({
                id: d.id,
                module: d.module,
                category: d.category,
                workType: d.work_type,
                detail: d.detail,
                sort_order: d.sort_order
            })),
            qualification: qualificationRows.length > 0 ? {
                education: qualificationRows[0].education,
                training: qualificationRows[0].training,
                experience: qualificationRows[0].experience,
                skills: qualificationRows[0].skills,
                otherRequirements: qualificationRows[0].other_requirements
            } : null,
            metrics: metricRows.map(m => ({
                id: m.id,
                dimension: m.dimension,
                metric: m.metric,
                standard: m.standard,
                source: m.source,
                sort_order: m.sort_order
            }))
        };
        
        res.json({ code: 200, data: result, message: 'success' });
    } catch (error) {
        console.error('Get position description by position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取岗位说明书列表
router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, position_id, position_code, position_name, job_title, level, department, 
                   supervisor, headcount, status, create_time, update_time
            FROM hr_position_description
            WHERE status = 1
            ORDER BY update_time DESC
        `);
        
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get position description list error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取所有岗位说明书（不分状态）
router.get('/all', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, position_id, position_code, position_name, job_title, level, department, 
                   supervisor, headcount, status, create_time, update_time
            FROM hr_position_description
            ORDER BY update_time DESC
        `);
        
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get all position descriptions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 根据岗位说明书ID获取详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 获取主表信息
        const [mainRows] = await pool.execute(`
            SELECT * FROM hr_position_description WHERE id = ?
        `, [id]);
        
        if (mainRows.length === 0) {
            return res.json({ code: 404, message: '岗位说明书不存在' });
        }
        
        const mainInfo = mainRows[0];
        
        // 获取职责明细
        const [dutyRows] = await pool.execute(`
            SELECT * FROM hr_position_duty 
            WHERE position_desc_id = ? 
            ORDER BY sort_order ASC
        `, [id]);
        
        // 获取任职资格
        const [qualificationRows] = await pool.execute(`
            SELECT * FROM hr_position_qualification 
            WHERE position_desc_id = ?
        `, [id]);
        
        // 获取考核指标
        const [metricRows] = await pool.execute(`
            SELECT * FROM hr_position_metric 
            WHERE position_desc_id = ? 
            ORDER BY sort_order ASC
        `, [id]);
        
        // 组装数据
        const result = {
            id: mainInfo.id,
            position_id: mainInfo.position_id,
            position_code: mainInfo.position_code,
            position_name: mainInfo.position_name,
            job_title: mainInfo.job_title,
            level: mainInfo.level,
            department: mainInfo.department,
            dept_type: mainInfo.dept_type,
            dept_nature: mainInfo.dept_nature,
            supervisor: mainInfo.supervisor,
            cross_supervisor: mainInfo.cross_supervisor,
            direct_subordinates: mainInfo.direct_subordinates,
            indirect_subordinates: mainInfo.indirect_subordinates,
            promotion_direction: mainInfo.promotion_direction,
            rotation_position: mainInfo.rotation_position,
            effective_date: mainInfo.effective_date,
            approver: mainInfo.approver,
            headcount: mainInfo.headcount,
            summary: mainInfo.summary,
            purpose: mainInfo.purpose,
            work_time: mainInfo.work_time,
            work_place: mainInfo.work_place,
            work_env: mainInfo.work_env,
            risk_level: mainInfo.risk_level,
            occupational_hazard: mainInfo.occupational_hazard,
            documents: mainInfo.documents,
            status: mainInfo.status,
            duties: dutyRows.map(d => ({
                id: d.id,
                module: d.module,
                category: d.category,
                workType: d.work_type,
                detail: d.detail,
                sort_order: d.sort_order
            })),
            qualification: qualificationRows.length > 0 ? {
                education: qualificationRows[0].education,
                training: qualificationRows[0].training,
                experience: qualificationRows[0].experience,
                skills: qualificationRows[0].skills,
                otherRequirements: qualificationRows[0].other_requirements
            } : null,
            metrics: metricRows.map(m => ({
                id: m.id,
                dimension: m.dimension,
                metric: m.metric,
                standard: m.standard,
                source: m.source,
                sort_order: m.sort_order
            }))
        };
        
        res.json({ code: 200, data: result, message: 'success' });
    } catch (error) {
        console.error('Get position description detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 创建岗位说明书
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            position_id, position_code, position_name, job_title, level, department,
            dept_type, dept_nature, supervisor, cross_supervisor, direct_subordinates,
            indirect_subordinates, promotion_direction, rotation_position,
            effective_date, approver, headcount, summary, purpose,
            work_time, work_place, work_env, risk_level, occupational_hazard, documents,
            duties, qualification, metrics
        } = req.body;
        
        // 插入主表
        const [mainResult] = await connection.execute(`
            INSERT INTO hr_position_description (
                position_id, position_code, position_name, job_title, level, department,
                dept_type, dept_nature, supervisor, cross_supervisor, direct_subordinates,
                indirect_subordinates, promotion_direction, rotation_position,
                effective_date, approver, headcount, summary, purpose,
                work_time, work_place, work_env, risk_level, occupational_hazard, documents
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            position_id, position_code, position_name, job_title, level, department,
            dept_type, dept_nature, supervisor, cross_supervisor || '', direct_subordinates || 0,
            indirect_subordinates || 0, promotion_direction || '', rotation_position || '',
            effective_date, approver || '', headcount || 1, summary || '', purpose || '',
            work_time || '', work_place || '', work_env || '', risk_level || '低', occupational_hazard || '', documents || ''
        ]);
        
        const descId = mainResult.insertId;
        
        // 插入职责明细
        if (duties && duties.length > 0) {
            for (let i = 0; i < duties.length; i++) {
                const duty = duties[i];
                await connection.execute(`
                    INSERT INTO hr_position_duty (position_desc_id, module, category, work_type, detail, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [descId, duty.module || '', duty.category || '', duty.workType || '核心', duty.detail || '', i]);
            }
        }
        
        // 插入任职资格
        if (qualification) {
            await connection.execute(`
                INSERT INTO hr_position_qualification (
                    position_desc_id, education, training, experience, skills, other_requirements
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                descId,
                qualification.education || '',
                qualification.training || '',
                qualification.experience || '',
                qualification.skills || '',
                qualification.otherRequirements || ''
            ]);
        }
        
        // 插入考核指标
        if (metrics && metrics.length > 0) {
            for (let i = 0; i < metrics.length; i++) {
                const metric = metrics[i];
                await connection.execute(`
                    INSERT INTO hr_position_metric (position_desc_id, dimension, metric, standard, source, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [descId, metric.dimension || '', metric.metric || '', metric.standard || '', metric.source || '', i]);
            }
        }
        
        await connection.commit();
        res.json({ code: 200, data: { id: descId }, message: '创建成功' });
    } catch (error) {
        await connection.rollback();
        console.error('Create position description error:', error);
        res.json({ code: 500, message: '服务器错误' });
    } finally {
        connection.release();
    }
});

// 更新岗位说明书
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const {
            position_id, position_code, position_name, job_title, level, department,
            dept_type, dept_nature, supervisor, cross_supervisor, direct_subordinates,
            indirect_subordinates, promotion_direction, rotation_position,
            effective_date, approver, headcount, summary, purpose,
            work_time, work_place, work_env, risk_level, occupational_hazard, documents, status,
            duties, qualification, metrics
        } = req.body;
        
        await connection.beginTransaction();
        
        // 更新主表
        await connection.execute(`
            UPDATE hr_position_description SET
                position_id = ?, position_code = ?, position_name = ?, job_title = ?, level = ?, department = ?,
                dept_type = ?, dept_nature = ?, supervisor = ?, cross_supervisor = ?, direct_subordinates = ?,
                indirect_subordinates = ?, promotion_direction = ?, rotation_position = ?,
                effective_date = ?, approver = ?, headcount = ?, summary = ?, purpose = ?,
                work_time = ?, work_place = ?, work_env = ?, risk_level = ?, occupational_hazard = ?, documents = ?, status = ?
            WHERE id = ?
        `, [
            position_id, position_code, position_name, job_title, level, department,
            dept_type, dept_nature, supervisor, cross_supervisor || '', direct_subordinates || 0,
            indirect_subordinates || 0, promotion_direction || '', rotation_position || '',
            effective_date, approver || '', headcount || 1, summary || '', purpose || '',
            work_time || '', work_place || '', work_env || '', risk_level || '低', occupational_hazard || '', documents || '',
            status !== undefined ? status : 1,
            id
        ]);
        
        // 删除旧的职责明细
        await connection.execute('DELETE FROM hr_position_duty WHERE position_desc_id = ?', [id]);
        
        // 插入新的职责明细
        if (duties && duties.length > 0) {
            for (let i = 0; i < duties.length; i++) {
                const duty = duties[i];
                await connection.execute(`
                    INSERT INTO hr_position_duty (position_desc_id, module, category, work_type, detail, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id, duty.module || '', duty.category || '', duty.workType || '核心', duty.detail || '', i]);
            }
        }
        
        // 更新任职资格（先删除再插入）
        await connection.execute('DELETE FROM hr_position_qualification WHERE position_desc_id = ?', [id]);
        
        if (qualification) {
            await connection.execute(`
                INSERT INTO hr_position_qualification (
                    position_desc_id, education, training, experience, skills, other_requirements
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                id,
                qualification.education || '',
                qualification.training || '',
                qualification.experience || '',
                qualification.skills || '',
                qualification.otherRequirements || ''
            ]);
        }
        
        // 删除旧的考核指标
        await connection.execute('DELETE FROM hr_position_metric WHERE position_desc_id = ?', [id]);
        
        // 插入新的考核指标
        if (metrics && metrics.length > 0) {
            for (let i = 0; i < metrics.length; i++) {
                const metric = metrics[i];
                await connection.execute(`
                    INSERT INTO hr_position_metric (position_desc_id, dimension, metric, standard, source, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id, metric.dimension || '', metric.metric || '', metric.standard || '', metric.source || '', i]);
            }
        }
        
        await connection.commit();
        res.json({ code: 200, data: { id }, message: '更新成功' });
    } catch (error) {
        await connection.rollback();
        console.error('Update position description error:', error);
        res.json({ code: 500, message: '服务器错误' });
    } finally {
        connection.release();
    }
});

// 删除岗位说明书
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        
        await connection.beginTransaction();
        
        // 删除关联的职责明细
        await connection.execute('DELETE FROM hr_position_duty WHERE position_desc_id = ?', [id]);
        
        // 删除关联的任职资格
        await connection.execute('DELETE FROM hr_position_qualification WHERE position_desc_id = ?', [id]);
        
        // 删除关联的考核指标
        await connection.execute('DELETE FROM hr_position_metric WHERE position_desc_id = ?', [id]);
        
        // 删除主表记录
        await connection.execute('DELETE FROM hr_position_description WHERE id = ?', [id]);
        
        await connection.commit();
        res.json({ code: 200, data: { id }, message: '删除成功' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete position description error:', error);
        res.json({ code: 500, message: '服务器错误' });
    } finally {
        connection.release();
    }
});

export default router;
