import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/recruitment/interviews', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT i.*, c.name as candidate_name, j.title as job_title, iw.name as interviewer_name
            FROM interview_schedule i
            LEFT JOIN candidate c ON i.candidate_id = c.id
            LEFT JOIN job_position j ON i.job_position_id = j.id
            LEFT JOIN employee iw ON i.interviewer_id = iw.id
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get interviews error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

export default router;