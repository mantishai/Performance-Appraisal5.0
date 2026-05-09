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
            SELECT a.*, COALESCE(e.name, '未知') as employee_name, d.dept_name as department
            FROM attendance_record a
            LEFT JOIN employee e ON a.employee_id = e.id
            LEFT JOIN department d ON e.department_id = d.id
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
            department: row.department || '未知',
            date: row.attendance_date,
            checkIn: row.clock_in_time ? row.clock_in_time.split(' ')[1] : null,
            checkOut: row.clock_out_time ? row.clock_out_time.split(' ')[1] : null,
            status: row.status === 'normal' ? '正常' : row.status === 'late' ? '迟到' : row.status === 'early' ? '早退' : row.status || '未知'
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

        const [empRows] = await pool.execute(`
            SELECT
                e.id as employee_id,
                COALESCE(e.name, '未知') as employee_name,
                d.dept_name as department
            FROM employee e
            LEFT JOIN department d ON e.department_id = d.id
        `);

        const summary = await Promise.all(empRows.map(async emp => {
            const [attRows] = await pool.execute(`
                SELECT status FROM attendance_record
                WHERE employee_id = ? AND attendance_date LIKE ?
            `, [emp.employee_id, `${month}%`]);

            const [leaveRows] = await pool.execute(`
                SELECT SUM(leave_days) as total_leave_days
                FROM leave_request
                WHERE employee_id = ? AND start_time LIKE ? AND approve_status = 1
            `, [emp.employee_id, `${month}%`]);

            let attendanceDays = 0;
            let lateCount = 0;
            let earlyLeaveCount = 0;

            attRows.forEach(row => {
                if (row.status !== 'absent') attendanceDays++;
                if (row.status === 'late') lateCount++;
                if (row.status === 'early') earlyLeaveCount++;
            });

            return {
                employeeId: emp.employee_id,
                employeeName: emp.employee_name,
                department: emp.department || '未知',
                attendanceDays: attendanceDays,
                lateCount: lateCount,
                earlyLeaveCount: earlyLeaveCount,
                leaveDays: parseInt(leaveRows[0]?.total_leave_days) || 0
            };
        }));

        res.json({ code: 200, data: summary, message: 'success' });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

export default router;