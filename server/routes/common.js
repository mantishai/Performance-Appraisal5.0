import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/departments', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT *, dept_name as name FROM department ORDER BY parent_id, sort_order');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get departments error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

router.get('/positions', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let query = 'SELECT * FROM position WHERE 1=1';
        const params = [];
        
        if (department_id) {
            query += ' AND department_id = ?';
            params.push(department_id);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get positions error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

export default router;