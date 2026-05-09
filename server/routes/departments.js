import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/org/departments', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM department ORDER BY parent_id, sort_order');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get departments error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/org/department', async (req, res) => {
    try {
        const { name, parent_id = 0, sort_order = 0 } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO department (name, parent_id, sort_order, created_at) VALUES (?, ?, ?, NOW())',
            [name, parent_id, sort_order]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' });
    } catch (error) {
        console.error('Add department error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/org/department/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parent_id, sort_order } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE department SET name = ?, parent_id = ?, sort_order = ? WHERE id = ?',
            [name, parent_id, sort_order, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '更新成功' });
    } catch (error) {
        console.error('Update department error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/org/department/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [childRows] = await pool.execute('SELECT id FROM department WHERE parent_id = ?', [id]);
        if (childRows.length > 0) {
            return res.json({ code: 400, message: '该部门下有子部门，无法删除' });
        }
        
        const [empRows] = await pool.execute('SELECT id FROM employee WHERE department_id = ?', [id]);
        if (empRows.length > 0) {
            return res.json({ code: 400, message: '该部门下有员工，无法删除' });
        }
        
        const [result] = await pool.execute('DELETE FROM department WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '删除成功' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;