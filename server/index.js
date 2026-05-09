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

app.get('/api/training/records', (req, res) => {
    res.json({ code: 200, data: [], message: 'success' });
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
            onlineUsers: 0,
            todayVisits: 0,
            errorCount: 0
        },
        message: 'success'
    });
});

app.get('/api/system/announcements', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '系统维护通知', content: '本周六将进行系统维护', time: '2026-05-10' }
        ],
        message: 'success'
    });
});

app.get('/api/system/todos', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '审批请假申请', status: 'pending', type: 'leave' },
            { id: 2, title: '完成绩效自评', status: 'pending', type: 'performance' }
        ],
        message: 'success'
    });
});

app.get('/api/system/schedule', (req, res) => {
    res.json({
        code: 200,
        data: [
            { id: 1, title: '部门会议', time: '2026-05-09 14:00', location: '会议室A' }
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