import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import positionRoutes from './routes/positions.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leave.js';
import recruitmentRoutes from './routes/recruitment.js';
import performanceRoutes from './routes/performance.js';
import trainingRoutes from './routes/training.js';
import talentRoutes from './routes/talent.js';
import alertRoutes from './routes/alert.js';
import systemRoutes from './routes/system.js';
import dashboardRoutes from './routes/dashboard.js';
import commonRoutes from './routes/common.js';
import interviewsRoutes from './routes/interviews.js';
import hrRoutes from './routes/hr.js';
import importRoutes from './routes/import.js';
import reportRoutes from './routes/report.js';
import archiveRoutes from './routes/archive.js';
import openapiRoutes from './routes/openapi.js';
import securityRoutes from './routes/security.js';
import auditRoutes from './routes/audit.js';
import todosRoutes from './routes/todos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', employeeRoutes);
app.use('/api', departmentRoutes);
app.use('/api', positionRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', leaveRoutes);
app.use('/api', recruitmentRoutes);
app.use('/api', performanceRoutes);
app.use('/api', trainingRoutes);
app.use('/api', talentRoutes);
app.use('/api', alertRoutes);
app.use('/api', systemRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', commonRoutes);
app.use('/api', interviewsRoutes);
app.use('/api', hrRoutes);
app.use('/api', importRoutes);
app.use('/api', reportRoutes);
app.use('/api', archiveRoutes);
app.use('/api', openapiRoutes);
app.use('/api', securityRoutes);
app.use('/api', auditRoutes);
app.use('/api', todosRoutes);

// 使用 /api/system/todos 路由 - 直接调用 todos 路由的相同逻辑
app.get('/api/system/todos', async (req, res) => {
    try {
        const { userId } = req.query;
        
        let query = `
            SELECT * FROM todo_task 
            WHERE 1=1
        `;
        const params = [];
        
        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        query += ' ORDER BY priority DESC, deadline ASC, create_time DESC';
        
        const [rows] = await pool.execute(query, params);
        
        // 转换字段名以匹配前端期望
        const todos = rows.map(row => ({
            id: row.id,
            title: row.task_title,
            content: row.task_content,
            type: row.task_type,
            priority: row.priority === 3 ? 'high' : row.priority === 2 ? 'medium' : 'low',
            status: row.status === 0 ? 'pending' : row.status === 1 ? 'completed' : 'ignored',
            completed: row.status === 1,
            createTime: row.create_time,
            dueTime: row.deadline,
            targetId: row.target_id
        }));
        
        res.json({ code: 200, data: todos, message: 'success' });
    } catch (error) {
        console.error('Get todos error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

app.get('/api/alert/risk-prediction', (req, res) => {
    res.json({
        code: 200,
        data: {
            high: [],
            medium: [],
            low: []
        },
        message: 'success'
    });
});

app.get('/api/system/dashboard', (req, res) => {
    res.json({
        code: 200,
        data: {
            currentUser: { id: 1, username: 'admin', name: '管理员', role: 'super_admin' },
            todos: { completed: 2, total: 5 },
            announcements: [],
            schedule: []
        },
        message: 'success'
    });
});

app.get('/api/system/announcements', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '系统升级通知', content: '系统将于本周六进行升级维护', publishTime: '2026-05-08', isTop: true },
            { id: 2, title: '新功能上线', content: '考勤管理新增月度统计功能', publishTime: '2026-05-05', isTop: false }
        ],
        message: 'success'
    });
});

app.get('/api/system/schedule', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '部门周会', time: '2026-05-09 09:00', location: '会议室A', type: 'meeting' },
            { id: 2, title: '项目评审', time: '2026-05-09 14:00', location: '会议室B', type: 'task' }
        ],
        message: 'success'
    });
});



app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: 'HRMS Backend Service is running' });
});

app.listen(PORT, () => {
    console.log(`HRMS 后端服务已启动: http://localhost:${PORT}`);
});