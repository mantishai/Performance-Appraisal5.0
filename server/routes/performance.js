import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/performance/plans', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM performance_plan');
        
        const plans = rows.map(row => ({
            id: row.id,
            name: row.plan_name || row.name,
            cycle: row.plan_type || row.cycle || 'quarterly',
            startDate: row.start_date,
            endDate: row.end_date,
            departments: row.departments ? JSON.parse(row.departments) : ['技术部', '产品部', '市场部'],
            status: row.status === 2 ? 'completed' : row.status === 1 ? 'ongoing' : 'pending',
            description: row.description
        }));
        
        res.json({ code: 200, data: plans, message: 'success' });
    } catch (error) {
        console.error('Get plans error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/performance/plan', async (req, res) => {
    try {
        const { name, start_date, end_date, description } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO performance_plan (name, start_date, end_date, description, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, start_date, end_date, description]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '绩效计划创建成功' });
    } catch (error) {
        console.error('Create plan error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/performance/evaluations', async (req, res) => {
    try {
        const { plan_id, employee_id } = req.query;
        
        let query = `
            SELECT e.*, p.plan_name as planName, emp.name as employeeName
            FROM performance_evaluation e
            LEFT JOIN performance_plan p ON e.plan_id = p.id
            LEFT JOIN employee emp ON e.employee_id = emp.id
            WHERE 1=1
        `;
        const params = [];
        
        if (plan_id) {
            query += ' AND e.plan_id = ?';
            params.push(plan_id);
        }
        if (employee_id) {
            query += ' AND e.employee_id = ?';
            params.push(employee_id);
        }
        
        const [rows] = await pool.execute(query, params);
        
        const evaluations = rows.map(row => {
            let selfStatus = 'pending';
            let leaderStatus = 'pending';
            if (row.status === 1) {
                selfStatus = 'completed';
            } else if (row.status === 2) {
                selfStatus = 'completed';
                leaderStatus = 'completed';
            }
            return {
                ...row,
                selfStatus,
                leaderStatus
            };
        });
        
        res.json({ code: 200, data: evaluations, message: 'success' });
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/performance/evaluation/:id/self', async (req, res) => {
    try {
        const { id } = req.params;
        const { self_score, self_comment } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE performance_evaluation SET self_score = ?, self_comment = ?, self_submitted_at = NOW() WHERE id = ?',
            [self_score, self_comment, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '自评提交成功' });
    } catch (error) {
        console.error('Submit self evaluation error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/performance/evaluation/:id/leader', async (req, res) => {
    try {
        const { id } = req.params;
        const { leader_score, leader_comment } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE performance_evaluation SET leader_score = ?, leader_comment = ?, leader_submitted_at = NOW() WHERE id = ?',
            [leader_score, leader_comment, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '上级评价提交成功' });
    } catch (error) {
        console.error('Submit leader evaluation error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/performance/kpis', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM kpi_indicator');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get KPIs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/performance/kpi', async (req, res) => {
    try {
        const { name, type, standard_score, formula, data_source } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO kpi_indicator (name, type, standard_score, formula, data_source, create_time) VALUES (?, ?, ?, ?, ?, NOW())',
            [name, type, standard_score, formula, data_source]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: 'KPI创建成功' });
    } catch (error) {
        console.error('Create KPI error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/performance/kpi/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, standard_score, formula, data_source } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE kpi_indicator SET name = ?, type = ?, standard_score = ?, formula = ?, data_source = ? WHERE id = ?',
            [name, type, standard_score, formula, data_source, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: 'KPI更新成功' });
    } catch (error) {
        console.error('Update KPI error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/performance/kpi/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM kpi_indicator WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: 'KPI删除成功' });
    } catch (error) {
        console.error('Delete KPI error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/performance/appeals', async (req, res) => {
    res.json({ code: 200, data: [], message: 'success' });
});

router.put('/performance/appeal/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { handle_comment, new_score, status } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE performance_appeal SET handle_comment = ?, new_score = ?, status = ?, handle_time = NOW() WHERE id = ?',
            [handle_comment, new_score, status || 'resolved', id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '申诉处理成功' });
    } catch (error) {
        console.error('Handle appeal error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/performance/result/statistics', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                grade, 
                COUNT(*) as count,
                AVG(final_score) as avg_score
            FROM performance_evaluation
            WHERE status = 'completed'
            GROUP BY grade
        `);
        
        const gradeDistribution = {};
        ['S', 'A', 'B', 'C', 'D'].forEach(g => gradeDistribution[g] = 0);
        rows.forEach(row => {
            if (row.grade) {
                gradeDistribution[row.grade] = parseInt(row.count);
            }
        });
        
        const [deptRows] = await pool.execute(`
            SELECT 
                d.dept_name as department,
                AVG(pe.final_score) as avg_score
            FROM performance_evaluation pe
            LEFT JOIN employee e ON pe.employee_id = e.id
            LEFT JOIN department d ON e.department_id = d.id
            WHERE pe.status = 'completed'
            GROUP BY d.dept_name
        `);
        
        const deptAvg = deptRows.map(row => ({
            department: row.department || '未知',
            avgScore: parseFloat(row.avg_score) || 0
        }));
        
        res.json({ 
            code: 200, 
            data: {
                gradeDistribution,
                deptAvg,
                completedCount: rows.reduce((sum, row) => sum + parseInt(row.count), 0)
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.json({ 
            code: 200, 
            data: {
                gradeDistribution: { S: 0, A: 0, B: 0, C: 0, D: 0 },
                deptAvg: [],
                completedCount: 0
            }, 
            message: 'success' 
        });
    }
});

export default router;