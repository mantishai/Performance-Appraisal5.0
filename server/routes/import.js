import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/import/records', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM import_record ORDER BY create_time DESC
        `);
        
        const records = rows.map(row => ({
            id: row.id,
            type: row.type,
            fileName: row.file_name,
            totalRows: row.total_rows,
            successRows: row.success_rows,
            failedRows: row.failed_rows,
            status: row.status || 'completed',
            errorMessage: row.error_message,
            createTime: row.create_time,
            updateTime: row.update_time
        }));
        
        res.json({ code: 200, data: records, message: 'success' });
    } catch (error) {
        console.error('Get import records error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/import/fields', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: [
                { id: 'name', label: '姓名', required: true },
                { id: 'id_card', label: '身份证号', required: true },
                { id: 'phone', label: '手机号', required: false },
                { id: 'email', label: '邮箱', required: false },
                { id: 'department', label: '部门', required: true },
                { id: 'position', label: '岗位', required: true },
                { id: 'hire_date', label: '入职日期', required: true },
                { id: 'education', label: '学历', required: false },
                { id: 'title', label: '职称', required: false },
                { id: 'salary', label: '薪资', required: false }
            ], 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get report fields error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/import/templates', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: [
                { id: 1, name: '员工导入模板', type: 'employee', createTime: '2026-05-01 10:00:00' },
                { id: 2, name: '培训记录模板', type: 'training', createTime: '2026-05-02 14:00:00' },
                { id: 3, name: '绩效数据模板', type: 'performance', createTime: '2026-05-03 09:00:00' }
            ], 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get report templates error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/import/templates/:id', async (req, res) => {
    try {
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        console.error('Delete report template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/import/template/:type', async (req, res) => {
    try {
        res.json({ code: 200, data: { template: 'base64_content' }, message: 'success' });
    } catch (error) {
        console.error('Get import template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/import/preview', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: { 
                rows: [], 
                total: 0, 
                success: 0, 
                failed: 0, 
                errors: [] 
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Preview import error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/import/templates', async (req, res) => {
    try {
        const { name, type, fields } = req.body;
        
        res.json({ code: 200, data: { id: 4 }, message: '保存成功' });
    } catch (error) {
        console.error('Save report template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/import/preview-report', async (req, res) => {
    try {
        const { templateId, dateRange } = req.body;
        
        res.json({ 
            code: 200, 
            data: { 
                columns: [], 
                rows: [], 
                total: 0 
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Preview report error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/import/export', async (req, res) => {
    try {
        const { templateId, dateRange, format } = req.body;
        
        res.json({ code: 200, data: { url: '/download/report' }, message: '导出成功' });
    } catch (error) {
        console.error('Export report error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/import/execute', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO import_record (type, file_name, total_rows, success_rows, failed_rows, status, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [type, 'api_import', data.length, data.length, 0, 'completed']
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '导入成功' });
    } catch (error) {
        console.error('Execute import error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;