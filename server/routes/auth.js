import { Router } from 'express';
import pool from '../db.js';

const router = Router();

let currentLoggedInUser = null;

router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [rows] = await pool.execute(
            'SELECT id, username, real_name as name, role, permissions FROM user WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (rows.length === 0) {
            return res.json({ code: 401, message: '用户名或密码错误' });
        }
        
        const user = rows[0];
        user.permissions = user.permissions && typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : (user.permissions || []);
        
        currentLoggedInUser = user;
        
        res.json({ 
            code: 200, 
            data: user, 
            message: '登录成功' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/auth/me', async (req, res) => {
    try {
        if (!currentLoggedInUser) {
            return res.json({ code: 401, message: '未登录' });
        }
        
        // 如果用户关联了员工ID，获取员工详细信息
        let employeeInfo = null;
        if (currentLoggedInUser.employee_id) {
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
                [currentLoggedInUser.employee_id]
            );
            
            if (employees.length > 0) {
                const employee = employees[0];
                employeeInfo = {
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
                };
            }
        }
        
        res.json({ 
            code: 200, 
            data: {
                ...currentLoggedInUser,
                employeeInfo: employeeInfo
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/current-user', async (req, res) => {
    try {
        if (!currentLoggedInUser) {
            return res.json({ code: 401, message: '未登录' });
        }
        
        res.json({ code: 200, data: currentLoggedInUser, message: 'success' });
    } catch (error) {
        console.error('Get current user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/auth/logout', async (req, res) => {
    currentLoggedInUser = null;
    res.json({ code: 200, message: '登出成功' });
});

export default router;