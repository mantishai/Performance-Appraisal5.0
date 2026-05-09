import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/departments', async (req, res) => {
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

router.get('/positions', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let query = 'SELECT p.*, p.position_name as name, p.dept_id as departmentId, d.dept_name as departmentName FROM position p LEFT JOIN department d ON p.dept_id = d.id WHERE 1=1';
        const params = [];
        
        if (department_id) {
            query += ' AND p.dept_id = ?';
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