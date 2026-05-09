import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/employees', async (req, res) => {
    try {
        const { department, position, status, keyword } = req.query;
        
        let query = `
            SELECT e.*, 
                   d.dept_name as department, 
                   p.position_name as position,
                   e.employee_no as employeeNo,
                   e.entry_date as entryDate
            FROM employee e
            LEFT JOIN department d ON e.department_id = d.id
            LEFT JOIN \`position\` p ON e.position_id = p.id
            WHERE 1=1
        `;
        const params = [];
        
        if (department) {
            query += ' AND e.department_id = ?';
            params.push(department);
        }
        if (position) {
            query += ' AND e.position_id = ?';
            params.push(position);
        }
        if (status !== undefined) {
            query += ' AND e.status = ?';
            params.push(status);
        }
        if (keyword) {
            query += ' AND (e.name LIKE ? OR e.employee_no LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get employees error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/employees', async (req, res) => {
    try {
        const { name, employee_no, phone, email, department_id, position_id, status = 1, hire_date, potential_tag = '中坚' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO employee (name, employee_no, phone, email, department_id, position_id, status, entry_date, potential_tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, employee_no, phone, email, department_id, position_id, status, hire_date, potential_tag]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' });
    } catch (error) {
        console.error('Add employee error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, employee_no, phone, email, department_id, position_id, status, hire_date, potential_tag } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE employee SET name = ?, employee_no = ?, phone = ?, email = ?, department_id = ?, position_id = ?, status = ?, entry_date = ?, potential_tag = ? WHERE id = ?',
            [name, employee_no, phone, email, department_id, position_id, status, hire_date, potential_tag, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '更新成功' });
    } catch (error) {
        console.error('Update employee error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM employee WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '删除成功' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;