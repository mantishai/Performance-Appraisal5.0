import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/leave', async (req, res) => {
    try {
        const { employee_id, type, start_date, end_date, days, reason } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO leave_request (employee_id, leave_type, start_time, end_time, leave_days, reason, approve_status, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [employee_id, type, start_date, end_date, days, reason, 0]
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
            SELECT l.id, l.employee_id, COALESCE(e.name, '') as employeeName, d.dept_name as department, l.leave_type as type, l.start_time as startDate, l.end_time as endDate, l.leave_days as leaveDays, CASE l.approve_status WHEN 0 THEN 'pending' WHEN 1 THEN 'approved' WHEN 2 THEN 'rejected' ELSE 'pending' END as status, l.reason, l.create_time as applyDate
            FROM leave_request l
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
            query += ' AND l.approve_status = ?';
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
            'UPDATE leave_request SET approve_status = ?, approve_time = NOW() WHERE id = ?',
            [1, id]
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
            'UPDATE leave_request SET approve_status = ?, approve_time = NOW() WHERE id = ?',
            [2, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '审批拒绝' });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;