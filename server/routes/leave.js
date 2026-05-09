import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/leave', async (req, res) => {
    try {
        const { employee_id, type, start_date, end_date, days, reason } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO leave_application (employee_id, type, start_date, end_date, days, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [employee_id, type, start_date, end_date, days, reason, 'pending']
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '请假申请提交成功' });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/leave/list', async (req, res) => {
    try {
        const { employee_id, status } = req.query;
        
        let query = `
            SELECT l.*, e.name as employee_name, e.department_id, d.dept_name as department_name
            FROM leave_application l
            LEFT JOIN employee e ON l.employee_id = e.id
            LEFT JOIN department d ON e.department_id = d.id
            WHERE 1=1
        `;
        const params = [];
        
        if (employee_id) {
            query += ' AND l.employee_id = ?';
            params.push(employee_id);
        }
        if (status) {
            query += ' AND l.status = ?';
            params.push(status);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get leave list error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/leave/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'UPDATE leave_application SET status = ?, approved_at = NOW() WHERE id = ?',
            ['approved', id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '审批通过' });
    } catch (error) {
        console.error('Approve leave error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/leave/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'UPDATE leave_application SET status = ?, rejected_at = NOW() WHERE id = ?',
            ['rejected', id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '审批拒绝' });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;