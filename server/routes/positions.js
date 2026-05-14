import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/positions', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let query = `
            SELECT p.*, p.position_name as name, p.dept_id as departmentId,
                   (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current
            FROM \`position\` p
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
            name: row.position_name,
            departmentId: row.dept_id,
            level: row.position_level || 'P5',
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

router.get('/org/positions', async (req, res) => {
    try {
        const { department_id } = req.query;
        
        let query = `
            SELECT p.*, p.position_name as name, p.dept_id as departmentId,
                   (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current,
                   p.is_key_position as isKeyPosition,
                   p.position_code as code,
                   p.job_description as duties,
                   p.requirement as requirements
            FROM \`position\` p
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
            name: row.position_name,
            code: row.position_code || '',
            departmentId: row.dept_id,
            level: typeof row.position_level === 'string' ? row.position_level : (row.position_level || 1),
            headcount: row.headcount || 0,
            current: row.current || 0,
            vacant: (row.headcount || 0) - (row.current || 0),
            isKeyPosition: row.is_key_position || 0,
            duties: row.job_description || '',
            requirements: row.requirement || ''
        }));
        
        res.json({ code: 200, data: positions, message: 'success' });
    } catch (error) {
        console.error('Get positions error:', error);
        res.json({ code: 200, data: [], message: 'success' });
    }
});

router.post('/org/position', async (req, res) => {
    try {
        console.log('新增岗位请求数据:', req.body);
        const { name, department_id, level = 'P5', headcount = 0, position_code } = req.body;
        
        const finalPositionCode = position_code && position_code.trim() 
            ? position_code.trim() 
            : `POS${Date.now()}`;
        
        console.log('准备插入数据:', {
            name,
            department_id,
            level,
            headcount,
            finalPositionCode
        });
        
        const [result] = await pool.execute(
            'INSERT INTO \`position\` (position_name, dept_id, position_level, headcount, position_code, status, create_time) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [name, department_id, level, headcount, finalPositionCode]
        );
        
        console.log('插入成功，ID:', result.insertId);
        res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' });
    } catch (error) {
        console.error('Add position error:', error);
        console.error('错误详情:', error.message);
        if (error.sql) {
            console.error('SQL语句:', error.sql);
        }
        res.json({ code: 500, message: '服务器错误: ' + error.message });
    }
});

router.put('/org/position/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department_id, level, headcount, position_code } = req.body;
        
        const finalPositionCode = position_code && position_code.trim() 
            ? position_code.trim() 
            : `POS${Date.now()}`;
        
        const [result] = await pool.execute(
            'UPDATE \`position\` SET position_name = ?, dept_id = ?, position_level = ?, headcount = ?, position_code = ?, update_time = NOW() WHERE id = ?',
            [name, department_id, level, headcount, finalPositionCode, id]
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
        
        const [result] = await pool.execute('DELETE FROM \`position\` WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '删除成功' });
    } catch (error) {
        console.error('Delete position error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;