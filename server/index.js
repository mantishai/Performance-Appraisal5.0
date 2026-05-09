import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.get('/api/system/todos', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '审批张三的请假申请', status: 'pending', type: 'leave', createTime: '2026-05-09', dueTime: '2026-05-10' },
            { id: 2, title: '完成绩效评估', status: 'pending', type: 'performance', createTime: '2026-05-08', dueTime: '2026-05-15' },
            { id: 3, title: '参加部门会议', status: 'completed', type: 'meeting', createTime: '2026-05-07', dueTime: '2026-05-08' }
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

app.get('/api/alert/list', (req, res) => {
    res.json({ code: 200, data: [
        { id: 1, type: 'contract', title: '合同到期提醒', content: '王五的合同将在30天内到期', level: 'high', status: 'pending', createTime: '2024-02-09 09:00:00' }
    ], message: 'success' });
});

app.get('/api/training/courses', (req, res) => {
    res.json({ code: 200, data: [
        { id: 1, name: 'React高级开发', category: '技术', lecturer: '张老师', hours: 12, capacity: 50, enrolledCount: 32, startDate: '2026-05-20', endDate: '2026-05-22', status: 'open' }
    ], message: 'success' });
});

app.get('/api/training/my-courses', (req, res) => {
    res.json({ code: 200, data: [], message: 'success' });
});

app.get('/api/training/records', (req, res) => {
    res.json({ code: 200, data: [], message: 'success' });
});

app.get('/api/performance/evaluations', (req, res) => {
    res.json({ code: 200, data: [
        { id: 1, employeeId: 1, employeeName: '张三', planId: 1, planName: '2026年Q1考核', department: '技术部', position: '前端工程师', selfScore: null, selfComment: null, selfStatus: 'pending', leaderScore: null, leaderComment: null, leaderStatus: 'pending', finalScore: null, grade: null, status: 'pending' }
    ], message: 'success' });
});

app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: 'HRMS Backend Service is running' });
});

app.listen(PORT, () => {
    console.log(`HRMS 后端服务已启动: http://localhost:${PORT}`);
});