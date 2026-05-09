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
            'SELECT * FROM attendance_record WHERE employee_id = ? AND attendance_date = ?',
            [employee_id, today]
        );
        
        let status = 'normal';
        const timePart = checkin_time.split(' ')[1] || checkin_time;
        
        if (existing.length > 0) {
            if (timePart < workEnd) {
                status = 'early';
            }
            await pool.execute(
                'UPDATE attendance_record SET clock_out_time = ?, status = ? WHERE id = ?',
                [checkin_time, status, existing[0].id]
            );
            res.json({ code: 200, data: { type: 'checkout' }, message: status === 'early' ? '早退打卡成功' : '下班打卡成功' });
        } else {
            if (timePart > workStart) {
                status = 'late';
            }
            await pool.execute(
                'INSERT INTO attendance_record (employee_id, attendance_date, clock_in_time, status, create_time) VALUES (?, ?, ?, ?, NOW())',
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
            FROM attendance_record a
            LEFT JOIN employee e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (employee_id) {
            query += ' AND a.employee_id = ?';
            params.push(employee_id);
        }
        if (month) {
            query += ' AND a.attendance_date LIKE ?';
            params.push(`${month}%`);
        }
        
        const [rows] = await pool.execute(query, params);
        
        const records = rows.map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            date: row.attendance_date,
            clockIn: row.clock_in_time,
            clockOut: row.clock_out_time,
            status: row.status === 'normal' ? '正常' : row.status === 'late' ? '迟到' : row.status === 'early' ? '早退' : row.status
        }));
        
        res.json({ code: 200, data: records, message: 'success' });
    } catch (error) {
        console.error('Get attendance records error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/attendance/summary', async (req, res) => {
    try {
        const { month } = req.query;
        
        const [summaryRows] = await pool.execute(`
            SELECT 
                a.status,
                COUNT(*) as count
            FROM attendance_record a
            WHERE a.attendance_date LIKE ?
            GROUP BY a.status
        `, [`${month}%`]);
        
        const statusMap = { 'normal': '正常', 'late': '迟到', 'early': '早退' };
        const summary = {
            total: 0,
            normal: 0,
            late: 0,
            early: 0,
            absent: 0
        };
        
        summaryRows.forEach(row => {
            const status = row.status;
            const count = parseInt(row.count);
            if (status === 'normal') summary.normal = count;
            else if (status === 'late') summary.late = count;
            else if (status === 'early') summary.early = count;
            summary.total += count;
        });
        
        const [leaveRows] = await pool.execute(`
            SELECT COUNT(*) as count
            FROM leave_request
            WHERE start_time LIKE ? AND approve_status = 1
        `, [`${month}%`]);
        
        summary.absent = parseInt(leaveRows[0]?.count) || 0;
        
        res.json({ code: 200, data: summary, message: 'success' });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.json({ 
            code: 200, 
            data: { total: 0, normal: 0, late: 0, early: 0, absent: 0 }, 
            message: 'success' 
        });
    }
});

export default router;