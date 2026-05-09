import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/recruitment/jobs', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM job_position WHERE status = "active"');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/recruitment/job', async (req, res) => {
    try {
        const { title, description, salary_min, salary_max, department_id, status = 'active' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO job_position (title, description, salary_min, salary_max, department_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [title, description, salary_min, salary_max, department_id, status]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '职位发布成功' });
    } catch (error) {
        console.error('Add job error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/recruitment/job/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, salary_min, salary_max, department_id, status } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE job_position SET title = ?, description = ?, salary_min = ?, salary_max = ?, department_id = ?, status = ? WHERE id = ?',
            [title, description, salary_min, salary_max, department_id, status, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '更新成功' });
    } catch (error) {
        console.error('Update job error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/recruitment/job/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('UPDATE job_position SET status = "inactive" WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '职位已下架' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/recruitment/candidates', async (req, res) => {
    try {
        const { position_id, status } = req.query;
        
        let query = 'SELECT * FROM candidate WHERE 1=1';
        const params = [];
        
        if (position_id) {
            query += ' AND position_id = ?';
            params.push(position_id);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/recruitment/candidate', async (req, res) => {
    try {
        const { name, phone, email, position_id, resume_text, status = 'pending' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO candidate (name, phone, email, position_id, resume_text, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [name, phone, email, position_id, resume_text, status]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '候选人添加成功' });
    } catch (error) {
        console.error('Add candidate error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/recruitment/candidates/upload', async (req, res) => {
    try {
        const { text } = req.body;
        
        const lines = text.split('\n');
        const candidates = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 3) {
                candidates.push({
                    name: parts[0]?.trim(),
                    phone: parts[1]?.trim(),
                    email: parts[2]?.trim(),
                    position_id: parts[3]?.trim() || null
                });
            }
        }
        
        res.json({ code: 200, data: { parsed: candidates }, message: '简历解析成功' });
    } catch (error) {
        console.error('Parse resume error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/recruitment/interviews', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT i.*, c.name as candidate_name, j.title as job_title, iw.name as interviewer_name
            FROM interview i
            LEFT JOIN candidate c ON i.candidate_id = c.id
            LEFT JOIN job_position j ON c.position_id = j.id
            LEFT JOIN employee iw ON i.interviewer_id = iw.id
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get interviews error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/recruitment/interview', async (req, res) => {
    try {
        const { candidate_id, interviewer_id, interview_time, location } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO interview (candidate_id, interviewer_id, interview_time, location, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [candidate_id, interviewer_id, interview_time, location, 'scheduled']
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '面试安排成功' });
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/recruitment/interview/:id/evaluation', async (req, res) => {
    try {
        const { id } = req.params;
        const { score, result, comment } = req.body;
        
        const [resultQuery] = await pool.execute(
            'UPDATE interview SET score = ?, result = ?, comment = ?, status = ? WHERE id = ?',
            [score, result, comment, 'completed', id]
        );
        
        res.json({ code: 200, data: { affectedRows: resultQuery.affectedRows }, message: '评价提交成功' });
    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;