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
                   e.department_id as department_id,
                   e.position_id as position_id,
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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        console.log('新增员工请求数据:', req.body);
        const { name, phone, email, department_id, position_id, status = 1, hire_date, potential_tag = '中坚', gender = 1 } = req.body;
        
        // 自动生成工号：EMP + 日期(YYYYMMDD) + 3位流水号
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        
        // 获取当天最大流水号
        const [seqResult] = await connection.execute(
            'SELECT MAX(employee_no) as max_no FROM employee WHERE employee_no LIKE ?',
            [`EMP${dateStr}%`]
        );
        
        let seq = 1;
        if (seqResult[0].max_no) {
            const lastSeq = parseInt(seqResult[0].max_no.slice(-3));
            seq = lastSeq + 1;
        }
        
        const employeeNo = `EMP${dateStr}${String(seq).padStart(3, '0')}`;
        console.log('自动生成的工号:', employeeNo);
        
        // 如果hire_date为空，使用当前日期
        const entryDate = hire_date || new Date().toISOString().split('T')[0];
        
        console.log('准备插入数据库的数据:', { name, employeeNo, phone, email, department_id, position_id, status, entryDate, potential_tag, gender });
        
        // 插入员工表
        const [empResult] = await connection.execute(
            'INSERT INTO employee (name, employee_no, gender, phone, email, department_id, position_id, status, entry_date, potential_tag, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, employeeNo, gender, phone, email, department_id, position_id, status, entryDate, potential_tag]
        );
        
        console.log('员工插入成功，ID:', empResult.insertId);
        
        // 自动创建登录账号（users表）
        const defaultPassword = '1'; // 默认密码
        await connection.execute(
            'INSERT INTO user (username, password, employee_id, employee_no, display_name, role, status, create_time) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
            [employeeNo, defaultPassword, empResult.insertId, employeeNo, name, 'employee']
        );
        
        console.log('用户账号创建成功');
        
        await connection.commit();
        res.json({ 
            code: 200, 
            data: { 
                id: empResult.insertId,
                employeeNo: employeeNo 
            }, 
            message: '新增成功，已自动创建登录账号，默认密码为: 1' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Add employee error:', error);
        console.error('错误详情:', error.message);
        if (error.sql) {
            console.error('SQL语句:', error.sql);
        }
        res.json({ code: 500, message: '服务器错误: ' + error.message });
    } finally {
        connection.release();
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
                department_id: employee.department_id,
                position_id: employee.position_id,
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

router.get('/employees/by-no/:employeeNo', async (req, res) => {
    try {
        const { employeeNo } = req.params;
        
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
             WHERE e.employee_no = ?`,
            [employeeNo]
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
                department_id: employee.department_id,
                position_id: employee.position_id,
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
        console.error('Get employee by employee_no error:', error);
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
                    d.id as department_id,
                    p.id as position_id,
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
                department_id: employee.department_id,
                position_id: employee.position_id,
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

router.put('/employees/:id/detail', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        const fields = [];
        const values = [];
        
        const fieldMap = {
            name: 'name',
            gender: 'gender',
            age: 'age',
            nation: 'nation',
            idCard: 'id_card',
            politicalStatus: 'political_status',
            archiveLocation: 'archive_location',
            healthReport: 'health_report',
            householdType: 'household_type',
            marriageStatus: 'marriage_status',
            registeredAddress: 'registered_address',
            currentAddress: 'current_address',
            phone: 'phone',
            email: 'email',
            emergencyContact: 'emergency_contact',
            emergencyPhone: 'emergency_phone',
            education: 'education',
            graduationDate: 'graduation_date',
            major: 'major',
            title: 'title',
            titleDate: 'title_date',
            workYears: 'work_years',
            workField: 'work_field',
            projectLevel: 'project_level',
            isManager: 'is_manager',
            department_id: 'department_id',
            position_id: 'position_id',
            entryDate: 'entry_date',
            regularDate: 'regular_date',
            departmentNature: 'department_nature',
            employeeType: 'employee_type',
            directSuperior: 'direct_superior',
            manager: 'manager',
            attendanceRequired: 'attendance_required',
            hireType: 'hire_type',
            unionJoinDate: 'union_join_date',
            confidentialAgreement: 'confidential_agreement',
            salary: 'salary',
            annualSalary: 'annual_salary',
            socialSecurityBase: 'social_security_base',
            socialSecurityCompany: 'social_security_company',
            socialSecurityStartDate: 'social_security_start_date',
            bankCard: 'bank_card'
        };
        
        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(data[key]);
            }
        }
        
        if (fields.length === 0) {
            return res.json({ code: 400, message: '没有需要更新的字段' });
        }
        
        values.push(id);
        
        const query = `UPDATE employee SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await pool.execute(query, values);
        
        if (result.affectedRows === 0) {
            return res.json({ code: 404, message: '员工不存在' });
        }
        
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        console.error('Update employee detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;