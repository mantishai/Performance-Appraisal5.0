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
        
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        
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
        
        const entryDate = hire_date || new Date().toISOString().split('T')[0];
        
        console.log('准备插入数据库的数据:', { name, employeeNo, phone, email, department_id, position_id, status, entryDate, potential_tag, gender });
        
        const [empResult] = await connection.execute(
            'INSERT INTO employee (name, employee_no, gender, phone, email, department_id, position_id, status, entry_date, potential_tag, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, employeeNo, gender, phone, email, department_id, position_id, status, entryDate, potential_tag]
        );
        
        console.log('员工插入成功，ID:', empResult.insertId);
        
        const defaultPassword = '1';
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
                    CASE e.gender WHEN 1 THEN '男' WHEN 2 THEN '女' ELSE '' END as genderText
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
        
        const [workExperiences] = await pool.execute('SELECT * FROM employee_work_experience WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [familyMembers] = await pool.execute('SELECT * FROM employee_family_member WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [projectPerformances] = await pool.execute('SELECT * FROM employee_project_performance WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [departmentInfos] = await pool.execute('SELECT * FROM employee_department_info WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [educationInfos] = await pool.execute('SELECT * FROM employee_education_info WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [awards] = await pool.execute('SELECT * FROM employee_award WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [titleInfos] = await pool.execute('SELECT * FROM employee_title_info WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [registrations] = await pool.execute('SELECT * FROM employee_registration WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [positionCertificates] = await pool.execute('SELECT * FROM employee_position_certificate WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [transfers] = await pool.execute('SELECT * FROM employee_transfer WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [processRecords] = await pool.execute('SELECT * FROM employee_process_record WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [contracts] = await pool.execute('SELECT * FROM employee_contract WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [trainings] = await pool.execute('SELECT * FROM employee_training WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [rewardPunishments] = await pool.execute('SELECT * FROM employee_reward_punishment WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [backgroundChecks] = await pool.execute('SELECT * FROM employee_background_check WHERE employee_id = ? ORDER BY sort_order', [id]);
        const [reminders] = await pool.execute('SELECT * FROM employee_reminder WHERE employee_id = ? ORDER BY reminder_date', [id]);
        const [auditLogs] = await pool.execute('SELECT * FROM employee_audit_log WHERE employee_id = ? ORDER BY created_at DESC', [id]);
        
        res.json({ 
            code: 200, 
            data: {
                id: employee.id,
                employeeNo: employee.employee_no,
                name: employee.name,
                gender: employee.genderText,
                genderCode: employee.gender,
                age: employee.age,
                nation: employee.nation,
                birthDate: employee.birth_date,
                nativePlace: employee.native_place,
                resumeAttachment: employee.resume_attachment,
                photo: employee.photo,
                
                idCard: employee.id_card,
                politicalStatus: employee.political_status,
                archiveLocation: employee.archive_location,
                healthReport: employee.health_report,
                householdType: employee.household_type,
                marriageStatus: employee.marriage_status,
                idCardStartDate: employee.id_card_start_date,
                idCardEndDate: employee.id_card_end_date,
                idCardAttachment: employee.id_card_attachment,
                
                registeredAddress: employee.registered_address,
                currentAddress: employee.current_address,
                phone: employee.phone,
                email: employee.email,
                emergencyContact: employee.emergency_contact,
                emergencyPhone: employee.emergency_phone,
                wechat: employee.wechat,
                qq: employee.qq,
                postalCode: employee.postal_code,
                
                education: employee.education,
                graduationDate: employee.graduation_date,
                major: employee.major,
                schoolName: employee.school_name,
                degree: employee.degree,
                foreignLanguage: employee.foreign_language,
                computerSkill: employee.computer_skill,
                title: employee.title,
                titleDate: employee.title_date,
                titleAttachment: employee.title_attachment,
                titleExpireDate: employee.title_expire_date,
                workYears: employee.work_years,
                workField: employee.work_field,
                projectLevel: employee.project_level,
                isManager: employee.is_manager,
                
                department: employee.department,
                position: employee.position,
                department_id: employee.department_id,
                position_id: employee.position_id,
                entryDate: employee.entry_date,
                regularDate: employee.regular_date,
                probationEndDate: employee.probation_end_date,
                probationReminder: employee.probation_reminder,
                departmentNature: employee.department_nature,
                employeeType: employee.employee_type,
                directSuperior: employee.direct_superior,
                manager: employee.manager,
                attendanceRequired: employee.attendance_required,
                hireType: employee.hire_type,
                unionJoinDate: employee.union_join_date,
                confidentialAgreement: employee.confidential_agreement,
                workEmail: employee.work_email,
                officePhone: employee.office_phone,
                officeLocation: employee.office_location,
                reportTo: employee.report_to,
                workCity: employee.work_city,
                
                salary: employee.salary,
                annualSalary: employee.annual_salary,
                socialSecurityBase: employee.social_security_base,
                socialSecurityCompany: employee.social_security_company,
                socialSecurityStartDate: employee.social_security_start_date,
                providentFundBase: employee.provident_fund_base,
                providentFundAccount: employee.provident_fund_account,
                performanceBonusRatio: employee.performance_bonus_ratio,
                mealAllowance: employee.meal_allowance,
                transportAllowance: employee.transport_allowance,
                communicationAllowance: employee.communication_allowance,
                salarySecurityLevel: employee.salary_security_level,
                bankCard: employee.bank_card,
                bankName: employee.bank_name,
                
                healthReportAttachment: employee.health_report_attachment,
                entryMaterialsChecklist: employee.entry_materials_checklist,
                contractAttachment: employee.contract_attachment,
                confidentialityAttachment: employee.confidentiality_attachment,
                nonCompeteAttachment: employee.non_compete_attachment,
                archiveStatus: employee.archive_status,
                
                workExperiences,
                familyMembers,
                projectPerformances,
                departmentInfos,
                educationInfos,
                awards,
                titleInfos,
                registrations,
                positionCertificates,
                transfers,
                processRecords,
                contracts,
                trainings,
                rewardPunishments,
                backgroundChecks,
                reminders,
                auditLogs
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get employee detail error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/employees/:id/detail', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const data = req.body;
        
        const fieldMap = {
            name: 'name',
            gender: 'gender',
            age: 'age',
            nation: 'nation',
            birthDate: 'birth_date',
            nativePlace: 'native_place',
            resumeAttachment: 'resume_attachment',
            photo: 'photo',
            
            idCard: 'id_card',
            politicalStatus: 'political_status',
            archiveLocation: 'archive_location',
            healthReport: 'health_report',
            householdType: 'household_type',
            marriageStatus: 'marriage_status',
            idCardStartDate: 'id_card_start_date',
            idCardEndDate: 'id_card_end_date',
            idCardAttachment: 'id_card_attachment',
            
            registeredAddress: 'registered_address',
            currentAddress: 'current_address',
            phone: 'phone',
            email: 'email',
            emergencyContact: 'emergency_contact',
            emergencyPhone: 'emergency_phone',
            wechat: 'wechat',
            qq: 'qq',
            postalCode: 'postal_code',
            
            education: 'education',
            graduationDate: 'graduation_date',
            major: 'major',
            schoolName: 'school_name',
            degree: 'degree',
            foreignLanguage: 'foreign_language',
            computerSkill: 'computer_skill',
            title: 'title',
            titleDate: 'title_date',
            titleAttachment: 'title_attachment',
            titleExpireDate: 'title_expire_date',
            workYears: 'work_years',
            workField: 'work_field',
            projectLevel: 'project_level',
            isManager: 'is_manager',
            
            department_id: 'department_id',
            position_id: 'position_id',
            entryDate: 'entry_date',
            regularDate: 'regular_date',
            probationEndDate: 'probation_end_date',
            probationReminder: 'probation_reminder',
            departmentNature: 'department_nature',
            employeeType: 'employee_type',
            directSuperior: 'direct_superior',
            manager: 'manager',
            attendanceRequired: 'attendance_required',
            hireType: 'hire_type',
            unionJoinDate: 'union_join_date',
            confidentialAgreement: 'confidential_agreement',
            workEmail: 'work_email',
            officePhone: 'office_phone',
            officeLocation: 'office_location',
            reportTo: 'report_to',
            workCity: 'work_city',
            
            salary: 'salary',
            annualSalary: 'annual_salary',
            socialSecurityBase: 'social_security_base',
            socialSecurityCompany: 'social_security_company',
            socialSecurityStartDate: 'social_security_start_date',
            providentFundBase: 'provident_fund_base',
            providentFundAccount: 'provident_fund_account',
            performanceBonusRatio: 'performance_bonus_ratio',
            mealAllowance: 'meal_allowance',
            transportAllowance: 'transport_allowance',
            communicationAllowance: 'communication_allowance',
            salarySecurityLevel: 'salary_security_level',
            bankCard: 'bank_card',
            bankName: 'bank_name',
            
            healthReportAttachment: 'health_report_attachment',
            entryMaterialsChecklist: 'entry_materials_checklist',
            contractAttachment: 'contract_attachment',
            confidentialityAttachment: 'confidentiality_attachment',
            nonCompeteAttachment: 'non_compete_attachment',
            archiveStatus: 'archive_status'
        };
        
        const fields = [];
        const values = [];
        
        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(data[key]);
            }
        }
        
        if (fields.length > 0) {
            values.push(id);
            const query = `UPDATE employee SET ${fields.join(', ')} WHERE id = ?`;
            const [result] = await connection.execute(query, values);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.json({ code: 404, message: '员工不存在' });
            }
        }
        
        const subTables = [
            { key: 'workExperiences', table: 'employee_work_experience' },
            { key: 'familyMembers', table: 'employee_family_member' },
            { key: 'projectPerformances', table: 'employee_project_performance' },
            { key: 'departmentInfos', table: 'employee_department_info' },
            { key: 'educationInfos', table: 'employee_education_info' },
            { key: 'awards', table: 'employee_award' },
            { key: 'titleInfos', table: 'employee_title_info' },
            { key: 'registrations', table: 'employee_registration' },
            { key: 'positionCertificates', table: 'employee_position_certificate' },
            { key: 'transfers', table: 'employee_transfer' },
            { key: 'processRecords', table: 'employee_process_record' },
            { key: 'contracts', table: 'employee_contract' },
            { key: 'trainings', table: 'employee_training' },
            { key: 'rewardPunishments', table: 'employee_reward_punishment' },
            { key: 'backgroundChecks', table: 'employee_background_check' }
        ];
        
        for (const { key, table } of subTables) {
            if (data[key] !== undefined && Array.isArray(data[key])) {
                await connection.execute(`DELETE FROM ${table} WHERE employee_id = ?`, [id]);
                
                for (const item of data[key]) {
                    const itemValues = [];
                    const itemFields = ['employee_id'];
                    itemValues.push(id);
                    
                    for (const [fieldKey, fieldValue] of Object.entries(item)) {
                        if (fieldKey !== 'id') {
                            itemFields.push(fieldKey);
                            itemValues.push(fieldValue);
                        }
                    }
                    
                    const insertQuery = `INSERT INTO ${table} (${itemFields.join(', ')}) VALUES (${itemValues.map(() => '?').join(', ')})`;
                    await connection.execute(insertQuery, itemValues);
                }
            }
        }
        
        await connection.commit();
        res.json({ code: 200, message: '更新成功' });
    } catch (error) {
        await connection.rollback();
        console.error('Update employee detail error:', error);
        res.json({ code: 500, message: '服务器错误: ' + error.message });
    } finally {
        connection.release();
    }
});

export default router;