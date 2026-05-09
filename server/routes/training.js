import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/training/courses', async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM training_course WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
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
            'INSERT INTO training_course (title, description, category, start_date, end_date, capacity, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
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
            'UPDATE training_course SET title = ?, description = ?, category = ?, start_date = ?, end_date = ?, capacity = ? WHERE id = ?',
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
        
        const [rows] = await pool.execute(`
            SELECT r.*, c.title, c.description, c.start_date, c.end_date
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

export default router;