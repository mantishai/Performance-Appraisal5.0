import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/org/departments', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT d.*, d.dept_name as name, d.parent_id as parentId, 
                   e.real_name as manager, 
                   (SELECT COUNT(*) FROM employee WHERE department_id = d.id) as employeeCount 
            FROM department d 
            LEFT JOIN user e ON d.leader_id = e.employee_id 
            ORDER BY d.parent_id, d.sort_order
        `);
        
        const departments = rows.map(row => ({
            id: row.id,
            name: row.name,
            parentId: row.parentId,
            manager: row.manager || '',
            employeeCount: row.employeeCount || 0,
            children: []
        }));
        
        res.json({ code: 200, data: departments, message: 'success' });
    } catch (error) {
        console.error('Get departments error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

router.post('/org/department', async (req, res) => {
    try {
        const { name, parent_id = 0, sort_order = 0 } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO department (dept_name, parent_id, sort_order, create_time) VALUES (?, ?, ?, NOW())',
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
            'UPDATE department SET dept_name = ?, parent_id = ?, sort_order = ? WHERE id = ?',
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