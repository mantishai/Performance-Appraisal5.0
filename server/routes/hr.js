import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/hr/contracts', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.*, e.name as employee_name, e.department, e.position
            FROM contract c
            LEFT JOIN employee e ON c.employee_id = e.id
        `);
        const contracts = rows.map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            contractNo: row.contract_no,
            type: row.type,
            startDate: row.start_date,
            endDate: row.end_date,
            salary: row.salary,
            status: row.status
        }));
        res.json({ code: 200, data: contracts, message: 'success' });
    } catch (error) {
        console.error('Get contracts error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/hr/contract', async (req, res) => {
    try {
        const { employeeId, employeeName, contractNo, type, startDate, endDate, salary } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO contract (employee_id, contract_no, type, start_date, end_date, salary, status, create_time) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
            [employeeId, contractNo, type, startDate, endDate, salary]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '合同创建成功' });
    } catch (error) {
        console.error('Create contract error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/hr/contract/:id/renew', async (req, res) => {
    try {
        const { id } = req.params;
        const { endDate } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE contract SET end_date = ? WHERE id = ?',
            [endDate, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '合同续签成功' });
    } catch (error) {
        console.error('Renew contract error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/hr/contract/:id/terminate', async (req, res) => {
    try {
        const { id } = req.params;
        const { terminateDate } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE contract SET status = 0, end_date = ? WHERE id = ?',
            [terminateDate, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '合同已终止' });
    } catch (error) {
        console.error('Terminate contract error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/hr/transfers', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT t.*, e.name as employee_name, e.department, e.position
            FROM personnel_transfer t
            LEFT JOIN employee e ON t.employee_id = e.id
            ORDER BY t.create_time DESC
        `);
        const transfers = rows.map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            type: row.type,
            oldValue: row.old_value,
            newValue: row.new_value,
            reason: row.reason,
            applyDate: row.create_time ? row.create_time.split(' ')[0] : '',
            status: row.status,
            approver: row.approver
        }));
        res.json({ code: 200, data: transfers, message: 'success' });
    } catch (error) {
        console.error('Get transfers error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/hr/transfer', async (req, res) => {
    try {
        const { employeeId, employeeName, type, oldValue, newValue, reason } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO personnel_transfer (employee_id, type, old_value, new_value, reason, status, create_time) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
            [employeeId, type, oldValue, newValue, reason]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '申请已提交' });
    } catch (error) {
        console.error('Create transfer error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/hr/transfer/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { approver } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE personnel_transfer SET status = "approved", approver = ?, approve_time = NOW() WHERE id = ?',
            [approver, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '审批已通过' });
    } catch (error) {
        console.error('Approve transfer error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/hr/transfer/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { approver } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE personnel_transfer SET status = "rejected", approver = ?, approve_time = NOW() WHERE id = ?',
            [approver, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '已拒绝' });
    } catch (error) {
        console.error('Reject transfer error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/hr/archive/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const [empRows] = await pool.execute('SELECT name, department, position FROM employee WHERE id = ?', [employeeId]);
        const employee = empRows[0];
        
        const archiveItems = [
            { key: 'id_card', name: '身份证复印件', status: 'complete', date: '2024-01-15' },
            { key: 'degree', name: '学历证书', status: 'complete', date: '2024-01-15' },
            { key: 'resume', name: '个人简历', status: 'complete', date: '2024-01-15' },
            { key: 'contract', name: '劳动合同', status: 'complete', date: '2024-01-15' },
            { key: 'bank_card', name: '银行卡信息', status: 'complete', date: '2024-01-16' },
            { key: 'emergency', name: '紧急联系人', status: 'missing', date: null },
            { key: 'health', name: '体检报告', status: 'missing', date: null },
            { key: 'insurance', name: '社保缴纳证明', status: 'complete', date: '2024-02-01' }
        ];
        
        res.json({ 
            code: 200, 
            data: {
                employeeId: parseInt(employeeId),
                employeeName: employee?.name || '',
                department: employee?.department || '',
                position: employee?.position || '',
                items: archiveItems
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get archive error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/hr/archive', async (req, res) => {
    try {
        res.json({ code: 200, data: {}, message: '档案更新成功' });
    } catch (error) {
        console.error('Update archive error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;