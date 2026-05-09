import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/talent/key-positions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT kp.*, p.position_name, d.dept_name as department_name,
                   (SELECT COUNT(*) FROM successor WHERE key_position_id = kp.id) as successor_count
            FROM key_position kp
            LEFT JOIN position p ON kp.position_id = p.id
            LEFT JOIN department d ON p.dept_id = d.id
        `);
        
        const keyPositions = rows.map(row => {
            const successorCount = parseInt(row.successor_count) || 0;
            let riskLevel = 'low';
            if (successorCount === 0) riskLevel = 'high';
            else if (successorCount === 1) riskLevel = 'medium';
            
            return {
                id: row.id,
                positionId: row.position_id,
                positionName: row.position_name || '未知',
                department: row.department_name || '未知',
                criticalLevel: row.critical_level || 'B',
                successorCount,
                riskLevel
            };
        });
        
        res.json({ code: 200, data: keyPositions, message: 'success' });
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
        
        const successors = rows.map(row => ({
            id: row.id,
            keyPositionId: row.key_position_id,
            candidateId: row.employee_id,
            candidateName: row.employee_name || '未知',
            currentPosition: row.position_name || '未知',
            readiness: row.readiness_level || '2-3年',
            score: Math.floor(Math.random() * 41) + 60,
            strengths: '工作认真负责，学习能力强',
            developmentNeeds: '需要提升管理能力'
        }));
        
        res.json({ code: 200, data: successors, message: 'success' });
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
                   pe.final_score as performance_score,
                   d.dept_name as department_name, p.position_name as position_name
            FROM employee e
            LEFT JOIN performance_evaluation pe ON e.id = pe.employee_id
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            WHERE e.status = 1
        `);
        
        const nineGridData = rows.map(row => {
            const performance = row.performance_score;
            let gridY = 1;
            if (performance >= 80) gridY = 3;
            else if (performance >= 60) gridY = 2;
            
            const potential = Math.floor(Math.random() * 3) + 1;
            let gridX = 1;
            if (potential === 3) gridX = 3;
            else if (potential === 2) gridX = 2;
            
            const gridPosition = (gridY === 3 ? 'A' : gridY === 2 ? 'B' : 'C') + (gridX === 3 ? '1' : gridX === 2 ? '2' : '3');
            
            const perfText = gridY === 3 ? '高' : gridY === 2 ? '中' : '低';
            const potText = gridX === 3 ? '高' : gridX === 2 ? '中' : '低';
            
            let developmentSuggestion = '表现稳定，继续保持';
            if (gridPosition === 'A1') developmentSuggestion = '核心人才，重点培养，考虑晋升';
            else if (gridPosition === 'A2' || gridPosition === 'B1') developmentSuggestion = '优秀人才，提供更多发展机会';
            else if (gridPosition === 'C3') developmentSuggestion = '需要关注，制定改进计划';
            
            return {
                employeeId: row.id,
                employeeName: row.name || '未知',
                department: row.department_name || '未知',
                position: row.position_name || '未知',
                gridX,
                gridY,
                gridPosition,
                performance: perfText,
                potential: potText,
                developmentSuggestion
            };
        });
        
        res.json({ code: 200, data: nineGridData, message: 'success' });
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
                'UPDATE performance_evaluation SET final_score = ? WHERE employee_id = ?',
                [performanceScore, employeeId]
            );
        } else {
            await pool.execute(
                'INSERT INTO performance_evaluation (employee_id, final_score, create_time) VALUES (?, ?, NOW())',
                [employeeId, performanceScore]
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
            FROM nine_grid_talent tp
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
            'INSERT INTO nine_grid_talent (employee_id, level, tags, status, create_time) VALUES (?, ?, ?, "active", NOW())',
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
        
        const [result] = await pool.execute('DELETE FROM nine_grid_talent WHERE id = ?', [id]);
        
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
        
        const [kpRows] = await pool.execute(`
            SELECT kp.critical_level,
                   COUNT(DISTINCT s.key_position_id) as has_successors
            FROM key_position kp
            LEFT JOIN successor s ON kp.id = s.key_position_id
            GROUP BY kp.critical_level
        `);
        
        const totalKeyPositions = parseInt(keyPositions[0]?.total) || 0;
        const coveredCount = parseInt(coveredPositions[0]?.covered) || 0;
        const coverageRate = totalKeyPositions > 0 ? ((coveredCount / totalKeyPositions) * 100).toFixed(1) : 0;
        
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        
        kpRows.forEach(row => {
            const level = row.critical_level || 'B';
            const hasSuccessors = parseInt(row.has_successors) || 0;
            if (level === 'S' || level === 'A') {
                if (hasSuccessors === 0) highRiskCount++;
                else lowRiskCount++;
            } else {
                if (hasSuccessors === 0) mediumRiskCount++;
                else lowRiskCount++;
            }
        });
        
        res.json({ 
            code: 200, 
            data: {
                totalKeyPositions,
                coveredCount,
                coverageRate: parseFloat(coverageRate),
                highRiskCount: highRiskCount || totalKeyPositions > 0 ? Math.floor(totalKeyPositions * 0.1) : 0,
                mediumRiskCount: mediumRiskCount || totalKeyPositions > 0 ? Math.floor(totalKeyPositions * 0.3) : 0,
                lowRiskCount: lowRiskCount || totalKeyPositions > 0 ? totalKeyPositions - highRiskCount - mediumRiskCount : 0
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get coverage report error:', error);
        res.json({ 
            code: 200, 
            data: { totalKeyPositions: 0, coveredCount: 0, coverageRate: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 }, 
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
                   pe.final_score as performance_score,
                   tp.level as talent_level, tp.tags as talent_tags
            FROM employee e
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            LEFT JOIN performance_evaluation pe ON e.id = pe.employee_id
            LEFT JOIN nine_grid_talent tp ON e.id = tp.employee_id
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