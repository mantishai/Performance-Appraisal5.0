import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/training/courses', async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM training_course WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND course_category = ?';
            params.push(category);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get courses error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/training/course', async (req, res) => {
    try {
        const { title, description, category, start_date, end_date, capacity } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO training_course (course_name, description, course_category, start_date, end_date, capacity, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [title, description, category, start_date, end_date, capacity]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '课程创建成功' });
    } catch (error) {
        console.error('Create course error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/training/course/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, start_date, end_date, capacity } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE training_course SET course_name = ?, description = ?, course_category = ?, start_date = ?, end_date = ?, capacity = ? WHERE id = ?',
            [title, description, category, start_date, end_date, capacity, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '课程更新成功' });
    } catch (error) {
        console.error('Update course error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/training/register', async (req, res) => {
    try {
        const { employee_id, course_id } = req.body;
        
        const [existing] = await pool.execute(
            'SELECT id FROM training_registration WHERE employee_id = ? AND course_id = ?',
            [employee_id, course_id]
        );
        
        if (existing.length > 0) {
            return res.json({ code: 400, message: '您已报名该课程' });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO training_registration (employee_id, course_id, status, created_at) VALUES (?, ?, ?, NOW())',
            [employee_id, course_id, 'registered']
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '报名成功' });
    } catch (error) {
        console.error('Register course error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/training/register/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM training_registration WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '取消报名成功' });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/training/my-courses', async (req, res) => {
    try {
        const { employee_id } = req.query;
        
        if (!employee_id) {
            return res.json({ code: 200, data: [], message: 'success' });
        }
        
        const [rows] = await pool.execute(`
            SELECT r.*, c.course_name, c.description, c.start_date, c.end_date
            FROM training_registration r
            LEFT JOIN training_course c ON r.course_id = c.id
            WHERE r.employee_id = ?
        `, [employee_id]);
        
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/training/signin', async (req, res) => {
    try {
        const { registration_id } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE training_registration SET status = ?, signed_at = NOW() WHERE id = ?',
            ['signed', registration_id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '签到成功' });
    } catch (error) {
        console.error('Signin error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/training/registrations/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const [rows] = await pool.execute(`
            SELECT r.*, e.name as employee_name, e.department, e.position
            FROM training_registration r
            LEFT JOIN employee e ON r.employee_id = e.id
            WHERE r.course_id = ?
        `, [courseId]);
        
        const registrations = rows.map(row => ({
            id: row.id,
            courseId: row.course_id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            department: row.department,
            position: row.position,
            status: row.status,
            createTime: row.created_at,
            signTime: row.signed_at
        }));
        
        res.json({ code: 200, data: registrations, message: 'success' });
    } catch (error) {
        console.error('Get registrations error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/training/records', async (req, res) => {
    try {
        const { employeeId } = req.query;
        
        let query = `
            SELECT r.*, c.course_name, c.course_category, c.start_date, c.end_date, e.name as employee_name
            FROM training_record r
            LEFT JOIN training_course c ON r.course_id = c.id
            LEFT JOIN employee e ON r.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (employeeId) {
            query += ' AND r.employee_id = ?';
            params.push(employeeId);
        }
        
        const [rows] = await pool.execute(query, params);
        
        const records = rows.map(row => ({
            id: row.id,
            courseId: row.course_id,
            courseTitle: row.course_name,
            category: row.course_category,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            attendance: row.attendance,
            score: row.score,
            evaluation: row.evaluation,
            hours: row.hours,
            recordTime: row.record_time
        }));
        
        res.json({ code: 200, data: records, message: 'success' });
    } catch (error) {
        console.error('Get training records error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/training/record', async (req, res) => {
    try {
        const { courseId, employeeId, attendance, score, evaluation, hours } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO training_record (course_id, employee_id, attendance, score, evaluation, hours, record_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [courseId, employeeId, attendance, score, evaluation, hours]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '记录创建成功' });
    } catch (error) {
        console.error('Create training record error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/training/statistics', async (req, res) => {
    try {
        const [courseRows] = await pool.execute('SELECT COUNT(*) as count FROM training_course');
        const [regRows] = await pool.execute('SELECT COUNT(*) as count FROM training_registration');
        const [recordRows] = await pool.execute('SELECT SUM(hours) as total FROM training_record');
        const [evalRows] = await pool.execute('SELECT AVG(score) as avg FROM training_record WHERE score IS NOT NULL');
        
        res.json({ 
            code: 200, 
            data: {
                totalSessions: parseInt(courseRows[0]?.count) || 0,
                totalParticipants: parseInt(regRows[0]?.count) || 0,
                totalHours: parseFloat(recordRows[0]?.total) || 0,
                avgSatisfaction: parseFloat(evalRows[0]?.avg) || 0
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get training statistics error:', error);
        res.json({ 
            code: 200, 
            data: { totalSessions: 0, totalParticipants: 0, totalHours: 0, avgSatisfaction: 0 }, 
            message: 'success' 
        });
    }
});

export default router;