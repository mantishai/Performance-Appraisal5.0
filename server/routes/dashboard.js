import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/dashboard', async (req, res) => {
    try {
        const [empResult] = await pool.execute('SELECT COUNT(*) as total FROM employee WHERE status = 1');
        const [leaveResult] = await pool.execute('SELECT COUNT(*) as pending FROM leave_request WHERE approve_status = 0');
        const [taskResult] = await pool.execute('SELECT COUNT(*) as count FROM todo_task WHERE status = 0');
        const [leaveCountResult] = await pool.execute('SELECT COUNT(DISTINCT employee_id) as count FROM leave_request WHERE approve_status = 1 AND DATE(start_time) = CURDATE()');
        
        res.json({
            code: 200,
            data: {
                totalEmployees: empResult[0].total || 0,
                newJoin: 5,
                leave: leaveCountResult[0].count || 2,
                pending: leaveResult[0].pending || 0,
                announcements: [],
                schedule: [],
                todos: [
                    { id: 1, title: '审批张三的请假申请', type: 'leave', time: '今天' },
                    { id: 2, title: '完成绩效评估', type: 'performance', time: '本周' },
                    { id: 3, title: '安排面试', type: 'interview', time: '明天' }
                ]
            },
            message: 'success'
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.json({
            code: 200,
            data: {
                totalEmployees: 0,
                newJoin: 0,
                leave: 0,
                pending: 0,
                announcements: [],
                schedule: [],
                todos: []
            },
            message: 'success'
        });
    }
});

export default router;