import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/talent/key-positions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT kp.*, p.name as position_name, d.name as department_name
            FROM key_position kp
            LEFT JOIN position p ON kp.position_id = p.id
            LEFT JOIN department d ON p.department_id = d.id
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get key positions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/talent/key-positions', async (req, res) => {
    try {
        const { position_id, critical_level = 'high' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO key_position (position_id, critical_level, created_at) VALUES (?, ?, NOW())',
            [position_id, critical_level]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '关键岗位标记成功' });
    } catch (error) {
        console.error('Mark key position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/successors', async (req, res) => {
    try {
        const { key_position_id } = req.query;
        
        let query = `
            SELECT s.*, e.name as employee_name, e.position_id, p.name as position_name
            FROM successor s
            LEFT JOIN employee e ON s.employee_id = e.id
            LEFT JOIN position p ON e.position_id = p.id
            WHERE 1=1
        `;
        const params = [];
        
        if (key_position_id) {
            query += ' AND s.key_position_id = ?';
            params.push(key_position_id);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get successors error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/talent/successors', async (req, res) => {
    try {
        const { key_position_id, employee_id, readiness_level = 'ready' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO successor (key_position_id, employee_id, readiness_level, created_at) VALUES (?, ?, ?, NOW())',
            [key_position_id, employee_id, readiness_level]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '继任者添加成功' });
    } catch (error) {
        console.error('Add successor error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/talent/nine-grid', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.id, e.name, e.employee_no, e.department_id, e.position_id,
                   pe.performance_score, pe.potential_score,
                   d.name as department_name, p.name as position_name
            FROM employee e
            LEFT JOIN performance_evaluation pe ON e.id = pe.employee_id
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN position p ON e.position_id = p.id
            WHERE e.status = 1
        `);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get nine grid error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;