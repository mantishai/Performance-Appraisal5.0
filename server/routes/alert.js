import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/alert/statistics', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT type, level, status, COUNT(*) as count
            FROM alert
            GROUP BY type, level, status
        `);
        
        const stats = {
            total: 0,
            byType: {},
            byLevel: {},
            byStatus: {}
        };
        
        rows.forEach(row => {
            stats.total += row.count;
            stats.byType[row.type] = (stats.byType[row.type] || 0) + row.count;
            stats.byLevel[row.level] = (stats.byLevel[row.level] || 0) + row.count;
            stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.count;
        });
        
        res.json({ code: 200, data: stats, message: 'success' });
    } catch (error) {
        console.error('Get alert statistics error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/alert/list', async (req, res) => {
    try {
        const { type, level, status } = req.query;
        
        let query = 'SELECT * FROM alert WHERE 1=1';
        const params = [];
        
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (level) {
            query += ' AND level = ?';
            params.push(level);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get alert list error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/alert/:id/handle', async (req, res) => {
    try {
        const { id } = req.params;
        const { handled_by, remark } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE alert SET status = ?, handled_by = ?, remark = ?, handled_at = NOW() WHERE id = ?',
            ['handled', handled_by, remark, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '预警已处理' });
    } catch (error) {
        console.error('Handle alert error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/alert/:id/ignore', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'UPDATE alert SET status = ?, ignored_at = NOW() WHERE id = ?',
            ['ignored', id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '预警已忽略' });
    } catch (error) {
        console.error('Ignore alert error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;