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

router.get('/org/departments/tree', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT d.*, d.dept_name as name, d.parent_id as parentId, 
                   e.real_name as manager, 
                   (SELECT COUNT(*) FROM employee WHERE department_id = d.id) as employeeCount,
                   (SELECT COUNT(*) FROM position WHERE dept_id = d.id) as positionCount
            FROM department d 
            LEFT JOIN user e ON d.leader_id = e.employee_id 
            WHERE d.status = 1
            ORDER BY d.parent_id, d.sort_order
        `);
        
        const departments = rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.dept_code,
            parentId: row.parent_id || 0,
            manager: row.manager || '',
            managerId: row.leader_id || null,
            employeeCount: row.employeeCount || 0,
            positionCount: row.positionCount || 0,
            phone: row.phone || '',
            email: row.email || '',
            status: row.status,
            description: row.description || '',
            children: []
        }));
        
        const buildTree = (items, parentId = 0) => {
            return items
                .filter(item => item.parentId === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id)
                }));
        };
        
        const tree = buildTree(departments);
        
        res.json({ code: 200, data: tree, message: 'success' });
    } catch (error) {
        console.error('Get department tree error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/org/department/:id/employees', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.execute(`
            SELECT e.*, e.name as employeeName, p.position_name as positionName, p.position_level as positionLevel,
                   d.dept_name as departmentName
            FROM employee e
            LEFT JOIN position p ON e.position_id = p.id
            LEFT JOIN department d ON e.department_id = d.id
            WHERE e.department_id = ? AND e.status = 1
            ORDER BY e.entry_date DESC
            LIMIT ?, ?
        `, [id, offset, limit]);
        
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM employee WHERE department_id = ? AND status = 1',
            [id]
        );
        
        const employees = rows.map(row => ({
            id: row.id,
            employeeNo: row.employee_no,
            name: row.employeeName,
            gender: row.gender,
            phone: row.phone,
            email: row.email,
            positionId: row.position_id,
            positionName: row.positionName,
            positionLevel: row.positionLevel,
            departmentName: row.departmentName,
            entryDate: row.entry_date,
            status: row.status
        }));
        
        res.json({ 
            code: 200, 
            data: employees, 
            total: countResult[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            message: 'success' 
        });
    } catch (error) {
        console.error('Get department employees error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/org/department/statistics', async (req, res) => {
    try {
        const [deptCount] = await pool.execute('SELECT COUNT(*) as count FROM department WHERE status = 1');
        const [empCount] = await pool.execute('SELECT COUNT(*) as count FROM employee WHERE status = 1');
        const [posCount] = await pool.execute('SELECT COUNT(*) as count FROM position WHERE status = 1');
        const [keyPosCount] = await pool.execute('SELECT COUNT(*) as count FROM key_position WHERE status = 1');
        
        const [deptStats] = await pool.execute(`
            SELECT d.dept_name as name, 
                   (SELECT COUNT(*) FROM employee WHERE department_id = d.id AND status = 1) as employeeCount,
                   (SELECT COUNT(*) FROM position WHERE dept_id = d.id AND status = 1) as positionCount
            FROM department d 
            WHERE d.status = 1 AND d.parent_id = 0
            ORDER BY d.sort_order
        `);
        
        res.json({ 
            code: 200, 
            data: {
                totalDepartments: deptCount[0].count,
                totalEmployees: empCount[0].count,
                totalPositions: posCount[0].count,
                totalKeyPositions: keyPosCount[0].count,
                departmentStats: deptStats.map(row => ({
                    name: row.name,
                    employeeCount: row.employeeCount,
                    positionCount: row.positionCount
                }))
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get department statistics error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/org/department', async (req, res) => {
    try {
        const { name, code, parent_id = 0, leader_id = null, phone = '', email = '', description = '', sort_order = 0 } = req.body;
        
        if (!name) {
            return res.json({ code: 400, message: '部门名称不能为空' });
        }
        
        if (!code) {
            return res.json({ code: 400, message: '部门编码不能为空' });
        }
        
        const [codeCheck] = await pool.execute('SELECT id FROM department WHERE dept_code = ?', [code]);
        if (codeCheck.length > 0) {
            return res.json({ code: 400, message: '部门编码已存在' });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO department (dept_name, dept_code, parent_id, leader_id, phone, email, description, sort_order, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, code, parent_id, leader_id, phone, email, description, sort_order]
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
        const { name, code, parent_id, leader_id, phone, email, description, sort_order, status } = req.body;
        
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined) {
            updateFields.push('dept_name = ?');
            updateValues.push(name);
        }
        if (code !== undefined) {
            const [codeCheck] = await pool.execute('SELECT id FROM department WHERE dept_code = ? AND id != ?', [code, id]);
            if (codeCheck.length > 0) {
                return res.json({ code: 400, message: '部门编码已存在' });
            }
            updateFields.push('dept_code = ?');
            updateValues.push(code);
        }
        if (parent_id !== undefined) {
            if (parent_id == id) {
                return res.json({ code: 400, message: '不能设置自己为上级部门' });
            }
            updateFields.push('parent_id = ?');
            updateValues.push(parent_id);
        }
        if (leader_id !== undefined) {
            updateFields.push('leader_id = ?');
            updateValues.push(leader_id);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (sort_order !== undefined) {
            updateFields.push('sort_order = ?');
            updateValues.push(sort_order);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        
        updateValues.push(id);
        
        const [result] = await pool.execute(
            `UPDATE department SET ${updateFields.join(', ')}, update_time = NOW() WHERE id = ?`,
            updateValues
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

router.put('/org/department/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (![0, 1].includes(status)) {
            return res.json({ code: 400, message: '无效的状态值' });
        }
        
        const [result] = await pool.execute(
            'UPDATE department SET status = ?, update_time = NOW() WHERE id = ?',
            [status, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '状态更新成功' });
    } catch (error) {
        console.error('Update department status error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/org/employees/for-select', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.id, e.name, e.employee_no, e.position_id, e.department_id, p.position_name as position_name, d.dept_name as dept_name
            FROM employee e
            LEFT JOIN \`position\` p ON e.position_id = p.id
            LEFT JOIN department d ON e.department_id = d.id
            WHERE e.status = 1
            ORDER BY d.sort_order, e.name
        `);

        const employees = rows.map(row => ({
            id: row.id,
            name: row.name,
            employeeNo: row.employee_no,
            positionId: row.position_id,
            departmentId: row.department_id,
            position: row.position_name || '',
            department: row.dept_name || ''
        }));

        res.json({ code: 200, data: employees, message: 'success' });
    } catch (error) {
        console.error('Get employees for select error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/org/departments/options', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, dept_name as name, parent_id as parentId, dept_level as level
            FROM department 
            WHERE status = 1
            ORDER BY parent_id, sort_order
        `);
        
        const buildTreeOptions = (items, parentId = 0, level = 0) => {
            return items
                .filter(item => item.parentId === parentId)
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    level: item.level,
                    children: buildTreeOptions(items, item.id, level + 1)
                }));
        };
        
        const tree = buildTreeOptions(rows);
        
        res.json({ code: 200, data: tree, message: 'success' });
    } catch (error) {
        console.error('Get department options error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/org/department/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(`
            SELECT d.*, d.dept_name as name, d.parent_id as parentId, 
                   e.real_name as manager,
                   (SELECT COUNT(*) FROM employee WHERE department_id = d.id) as employeeCount,
                   (SELECT COUNT(*) FROM position WHERE dept_id = d.id) as positionCount,
                   (SELECT dept_name FROM department WHERE id = d.parent_id) as parentName
            FROM department d 
            LEFT JOIN user e ON d.leader_id = e.employee_id 
            WHERE d.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.json({ code: 404, message: '部门不存在' });
        }
        
        const row = rows[0];
        const department = {
            id: row.id,
            name: row.name,
            code: row.dept_code,
            parentId: row.parentId,
            parentName: row.parentName || '',
            manager: row.manager || '',
            managerId: row.leader_id || null,
            phone: row.phone || '',
            email: row.email || '',
            employeeCount: row.employeeCount || 0,
            positionCount: row.positionCount || 0,
            status: row.status,
            description: row.description || '',
            sortOrder: row.sort_order
        };
        
        res.json({ code: 200, data: department, message: 'success' });
    } catch (error) {
        console.error('Get department detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;