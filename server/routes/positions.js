import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/org/positions', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let query = `
            SELECT p.*, p.position_name as name, p.dept_id as departmentId,
                   (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current
            FROM position p
            WHERE 1=1
        `;
        const params = [];
        
        if (department_id) {
            query += ' AND p.dept_id = ?';
            params.push(department_id);
        }
        
        const [rows] = await pool.execute(query, params);
        
        const positions = rows.map(row => ({
            id: row.id,
            name: row.name,
            departmentId: row.departmentId,
            level: row.level || 'P5',
            headcount: row.headcount || 0,
            current: row.current || 0,
            vacant: (row.headcount || 0) - (row.current || 0)
        }));
        
        res.json({ code: 200, data: positions, message: 'success' });
    } catch (error) {
        console.error('Get positions error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

router.post('/org/position', async (req, res) => {
    try {
        const { name, department_id, level = 'P5', headcount = 0, sort_order = 0 } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO position (position_name, dept_id, level, headcount, sort_order, create_time) VALUES (?, ?, ?, ?, ?, NOW())',
            [name, department_id, level, headcount, sort_order]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' });
    } catch (error) {
        console.error('Add position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/org/position/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department_id, level, headcount, sort_order } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE position SET position_name = ?, dept_id = ?, level = ?, headcount = ?, sort_order = ? WHERE id = ?',
            [name, department_id, level, headcount, sort_order, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '更新成功' });
    } catch (error) {
        console.error('Update position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/org/position/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [empRows] = await pool.execute('SELECT id FROM employee WHERE position_id = ?', [id]);
        if (empRows.length > 0) {
            return res.json({ code: 400, message: '该岗位下有员工，无法删除' });
        }
        
        const [result] = await pool.execute('DELETE FROM position WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '删除成功' });
    } catch (error) {
        console.error('Delete position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;