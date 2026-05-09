import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/talent/key-positions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT kp.*, p.position_name, d.dept_name as department_name
            FROM key_position kp
            LEFT JOIN position p ON kp.position_id = p.id
            LEFT JOIN department d ON p.dept_id = d.id
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get key positions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/talent/key-positions', async (req, res) => {
    try {
        const { position_id, critical_level = 'high' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO key_position (position_id, critical_level, created_at) VALUES (?, ?, NOW())',
            [position_id, critical_level]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '关键岗位标记成功' });
    } catch (error) {
        console.error('Mark key position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/successors', async (req, res) => {
    try {
        const { key_position_id } = req.query;
        
        let query = `
            SELECT s.*, e.name as employee_name, e.position_id, p.position_name as position_name
            FROM successor s
            LEFT JOIN employee e ON s.employee_id = e.id
            LEFT JOIN position p ON e.position_id = p.id
            WHERE 1=1
        `;
        const params = [];
        
        if (key_position_id) {
            query += ' AND s.key_position_id = ?';
            params.push(key_position_id);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get successors error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/talent/successors', async (req, res) => {
    try {
        const { key_position_id, employee_id, readiness_level = 'ready' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO successor (key_position_id, employee_id, readiness_level, created_at) VALUES (?, ?, ?, NOW())',
            [key_position_id, employee_id, readiness_level]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '继任者添加成功' });
    } catch (error) {
        console.error('Add successor error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/nine-grid', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.id, e.name, e.employee_no, e.department_id, e.position_id,
                   pe.performance_score, pe.potential_score,
                   d.dept_name as department_name, p.position_name as position_name
            FROM employee e
            LEFT JOIN performance_evaluation pe ON e.id = pe.employee_id
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            WHERE e.status = 1
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get nine grid error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/talent/nine-grid', async (req, res) => {
    try {
        const { employeeId, performanceScore, potentialScore } = req.body;
        
        const [existing] = await pool.execute(
            'SELECT id FROM performance_evaluation WHERE employee_id = ?',
            [employeeId]
        );
        
        if (existing.length > 0) {
            await pool.execute(
                'UPDATE performance_evaluation SET performance_score = ?, potential_score = ?, update_time = NOW() WHERE employee_id = ?',
                [performanceScore, potentialScore, employeeId]
            );
        } else {
            await pool.execute(
                'INSERT INTO performance_evaluation (employee_id, performance_score, potential_score, create_time) VALUES (?, ?, ?, NOW())',
                [employeeId, performanceScore, potentialScore]
            );
        }
        
        res.json({ code: 200, message: '九宫格数据更新成功' });
    } catch (error) {
        console.error('Update nine grid error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/talent-pool', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT tp.*, e.name as employee_name, e.employee_no, e.department_id, e.position_id,
                   d.dept_name as department_name, p.position_name as position_name
            FROM talent_pool tp
            LEFT JOIN employee e ON tp.employee_id = e.id
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            ORDER BY tp.create_time DESC
        `);
        
        const talentPool = rows.map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            employeeNo: row.employee_no,
            departmentId: row.department_id,
            departmentName: row.department_name,
            positionId: row.position_id,
            positionName: row.position_name,
            level: row.level || 'B',
            tags: row.tags ? JSON.parse(row.tags) : [],
            status: row.status || 'active',
            createTime: row.create_time
        }));
        
        res.json({ code: 200, data: talentPool, message: 'success' });
    } catch (error) {
        console.error('Get talent pool error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/talent/talent-pool', async (req, res) => {
    try {
        const { employeeId, level = 'B', tags = [] } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO talent_pool (employee_id, level, tags, status, create_time) VALUES (?, ?, ?, "active", NOW())',
            [employeeId, level, JSON.stringify(tags)]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '加入人才池成功' });
    } catch (error) {
        console.error('Add to talent pool error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/talent/talent-pool/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM talent_pool WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '移出人才池成功' });
    } catch (error) {
        console.error('Remove from talent pool error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/coverage-report', async (req, res) => {
    try {
        const [keyPositions] = await pool.execute('SELECT COUNT(*) as total FROM key_position');
        const [coveredPositions] = await pool.execute(`
            SELECT COUNT(DISTINCT s.key_position_id) as covered 
            FROM successor s
            JOIN key_position kp ON s.key_position_id = kp.id
        `);
        
        const [deptStats] = await pool.execute(`
            SELECT d.dept_name as department, 
                   COUNT(kp.id) as keyPositions,
                   COUNT(DISTINCT s.key_position_id) as coveredPositions
            FROM department d
            LEFT JOIN position p ON d.id = p.dept_id
            LEFT JOIN key_position kp ON p.id = kp.position_id
            LEFT JOIN successor s ON kp.id = s.key_position_id
            GROUP BY d.id, d.dept_name
        `);
        
        const totalKeyPositions = parseInt(keyPositions[0]?.total) || 0;
        const coveredCount = parseInt(coveredPositions[0]?.covered) || 0;
        const coverageRate = totalKeyPositions > 0 ? ((coveredCount / totalKeyPositions) * 100).toFixed(1) : 0;
        
        res.json({ 
            code: 200, 
            data: {
                totalKeyPositions,
                coveredPositions: coveredCount,
                coverageRate: parseFloat(coverageRate),
                byDepartment: deptStats.map(row => ({
                    department: row.department,
                    keyPositions: parseInt(row.keyPositions) || 0,
                    coveredPositions: parseInt(row.coveredPositions) || 0,
                    coverageRate: parseInt(row.keyPositions) > 0 
                        ? ((parseInt(row.coveredPositions) / parseInt(row.keyPositions)) * 100).toFixed(1) 
                        : '0'
                }))
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get coverage report error:', error);
        res.json({ 
            code: 200, 
            data: { totalKeyPositions: 0, coveredPositions: 0, coverageRate: 0, byDepartment: [] }, 
            message: 'success' 
        });
    }
});

router.put('/talent/key-position/:id/level', async (req, res) => {
    try {
        const { id } = req.params;
        const { criticalLevel } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE key_position SET critical_level = ?, update_time = NOW() WHERE id = ?',
            [criticalLevel, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '关键岗位等级更新成功' });
    } catch (error) {
        console.error('Update key position level error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/employee/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(`
            SELECT e.*, d.dept_name as department_name, p.position_name as position_name,
                   pe.performance_score, pe.potential_score,
                   tp.level as talent_level, tp.tags as talent_tags
            FROM employee e
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            LEFT JOIN performance_evaluation pe ON e.id = pe.employee_id
            LEFT JOIN talent_pool tp ON e.id = tp.employee_id
            WHERE e.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.json({ code: 404, message: '员工不存在' });
        }
        
        const employee = rows[0];
        res.json({ 
            code: 200, 
            data: {
                ...employee,
                talentTags: employee.talent_tags ? JSON.parse(employee.talent_tags) : []
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get talent detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;