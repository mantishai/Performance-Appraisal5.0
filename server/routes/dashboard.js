import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/dashboard', async (req, res) => {
    try {
        const [empResult] = await pool.execute('SELECT COUNT(*) as total FROM employee WHERE status = 1');
        const [leaveResult] = await pool.execute('SELECT COUNT(*) as pending FROM leave_request WHERE status = "pending"');
        const [taskResult] = await pool.execute('SELECT COUNT(*) as count FROM todo_task WHERE status = "pending"');
        
        res.json({
            code: 200,
            data: {
                statistics: {
                    totalEmployees: empResult[0].total || 0,
                    pendingLeave: leaveResult[0].pending || 0,
                    pendingTasks: taskResult[0].count || 0,
                    newEmployees: 5,
                    birthdays: 3
                },
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
                statistics: { totalEmployees: 0, pendingLeave: 0, pendingTasks: 0, newEmployees: 0, birthdays: 0 },
                todos: []
            },
            message: 'success'
        });
    }
});

export default router;