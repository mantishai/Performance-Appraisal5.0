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

app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: 'HRMS Backend Service is running' });
});

app.listen(PORT, () => {
    console.log(`HRMS 后端服务已启动: http://localhost:${PORT}`);
});