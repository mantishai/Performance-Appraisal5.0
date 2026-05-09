import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/performance/plans', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM performance_plan');
        res.json({ code: 200, data: rows, message: 'success' });
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
            SELECT e.*, p.plan_name as plan_name, emp.name as employee_name
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
        res.json({ code: 200, data: rows, message: 'success' });
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

export default router;