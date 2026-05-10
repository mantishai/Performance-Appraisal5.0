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
        console.log('新增员工请求数据:', req.body);
        const { name, employee_no, phone, email, department_id, position_id, status = 1, hire_date, potential_tag = '中坚', gender = 1 } = req.body;
        
        // 如果hire_date为空，使用当前日期
        const entryDate = hire_date || new Date().toISOString().split('T')[0];
        
        console.log('准备插入数据库的数据:', { name, employee_no, phone, email, department_id, position_id, status, entryDate, potential_tag, gender });
        
        const [result] = await pool.execute(
            'INSERT INTO employee (name, employee_no, gender, phone, email, department_id, position_id, status, entry_date, potential_tag, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, employee_no, gender, phone, email, department_id, position_id, status, entryDate, potential_tag]
        );
        
        console.log('插入成功，ID:', result.insertId);
        res.json({ code: 200, data: { id: result.insertId }, message: '新增成功' });
    } catch (error) {
        console.error('Add employee error:', error);
        console.error('错误详情:', error.message);
        if (error.sql) {
            console.error('SQL语句:', error.sql);
        }
        res.json({ code: 500, message: '服务器错误: ' + error.message });
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

router.get('/employees/by-name/:name', async (req, res) => {
    try {
        const { name } = req.params;
        
        const [employees] = await pool.execute(
            `SELECT e.*, 
                    d.dept_name as department, 
                    p.position_name as position,
                    e.employee_no as employeeNo,
                    e.entry_date as entryDate,
                    e.regular_date as regularDate,
                    CASE e.gender WHEN 1 THEN '男' WHEN 0 THEN '女' ELSE '' END as genderText
             FROM employee e
             LEFT JOIN department d ON e.department_id = d.id
             LEFT JOIN \`position\` p ON e.position_id = p.id
             WHERE e.name = ?`,
            [name]
        );
        
        if (employees.length === 0) {
            return res.json({ code: 404, message: '未找到该员工' });
        }
        
        const employee = employees[0];
        
        res.json({ 
            code: 200, 
            data: {
                id: employee.id,
                employeeNo: employee.employee_no,
                name: employee.name,
                gender: employee.genderText,
                birthDate: employee.birth_date,
                idCard: employee.id_card,
                phone: employee.phone,
                email: employee.email,
                address: employee.address,
                department: employee.department,
                position: employee.position,
                jobLevel: employee.job_level,
                entryDate: employee.entry_date,
                regularDate: employee.regular_date,
                status: employee.status === 1 ? '在职' : employee.status === 2 ? '试用期' : '离职',
                employmentType: employee.employment_type === 1 ? '正式员工' : employee.employment_type === 2 ? '兼职' : employee.employment_type === 3 ? '实习生' : '劳务派遣',
                avatar: employee.avatar
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get employee by name error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/employees/:id/detail', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [employees] = await pool.execute(
            `SELECT e.*, 
                    d.dept_name as department, 
                    p.position_name as position,
                    e.employee_no as employeeNo,
                    e.entry_date as entryDate,
                    e.regular_date as regularDate,
                    CASE e.gender WHEN 1 THEN '男' WHEN 0 THEN '女' ELSE '' END as genderText
             FROM employee e
             LEFT JOIN department d ON e.department_id = d.id
             LEFT JOIN \`position\` p ON e.position_id = p.id
             WHERE e.id = ?`,
            [id]
        );
        
        if (employees.length === 0) {
            return res.json({ code: 404, message: '员工不存在' });
        }
        
        const employee = employees[0];
        
        res.json({ 
            code: 200, 
            data: {
                id: employee.id,
                employeeNo: employee.employee_no,
                name: employee.name,
                gender: employee.genderText,
                birthDate: employee.birth_date,
                idCard: employee.id_card,
                phone: employee.phone,
                email: employee.email,
                address: employee.address,
                department: employee.department,
                position: employee.position,
                jobLevel: employee.job_level,
                entryDate: employee.entry_date,
                regularDate: employee.regular_date,
                status: employee.status === 1 ? '在职' : employee.status === 2 ? '试用期' : '离职',
                employmentType: employee.employment_type === 1 ? '正式员工' : employee.employment_type === 2 ? '兼职' : employee.employment_type === 3 ? '实习生' : '劳务派遣',
                avatar: employee.avatar
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get employee detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;