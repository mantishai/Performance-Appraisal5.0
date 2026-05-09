import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/attendance/checkin', async (req, res) => {
    try {
        const { employee_id, checkin_time } = req.body;
        const workStart = '09:00';
        const workEnd = '18:00';
        
        const today = new Date().toISOString().split('T')[0];
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
            [employee_id, today]
        );
        
        let status = 'normal';
        const timePart = checkin_time.split(' ')[1] || checkin_time;
        
        if (existing.length > 0) {
            await pool.execute(
                'UPDATE attendance SET checkout_time = ?, status = ? WHERE id = ?',
                [checkin_time, status, existing[0].id]
            );
            res.json({ code: 200, data: { type: 'checkout' }, message: '下班打卡成功' });
        } else {
            if (timePart > workStart) {
                status = 'late';
            }
            await pool.execute(
                'INSERT INTO attendance (employee_id, date, checkin_time, status, created_at) VALUES (?, ?, ?, ?, NOW())',
                [employee_id, today, checkin_time, status]
            );
            res.json({ code: 200, data: { type: 'checkin', status }, message: status === 'late' ? '迟到打卡成功' : '上班打卡成功' });
        }
    } catch (error) {
        console.error('Checkin error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/attendance/records', async (req, res) => {
    try {
        const { employee_id, month } = req.query;
        
        let query = `
            SELECT a.*, e.name as employee_name 
            FROM attendance a
            LEFT JOIN employee e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (employee_id) {
            query += ' AND a.employee_id = ?';
            params.push(employee_id);
        }
        if (month) {
            query += ' AND a.date LIKE ?';
            params.push(`${month}%`);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get attendance records error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;