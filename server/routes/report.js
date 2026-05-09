import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/report/fields', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: {
                employee: ['name', 'employee_no', 'department', 'position', 'entry_date', 'status'],
                attendance: ['date', 'employee_id', 'check_in', 'check_out', 'status'],
                performance: ['employee_id', 'score', 'level', 'evaluation', 'year', 'quarter'],
                leave: ['employee_id', 'type', 'start_date', 'end_date', 'days', 'status']
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get report fields error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/report/template/list', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM report_template ORDER BY create_time DESC');
        
        const templates = rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            fields: row.fields ? JSON.parse(row.fields) : [],
            filters: row.filters ? JSON.parse(row.filters) : {},
            layout: row.layout || 'table',
            enabled: row.status === 1,
            createTime: row.create_time,
            updateTime: row.update_time
        }));
        
        res.json({ code: 200, data: templates, message: 'success' });
    } catch (error) {
        console.error('Get report templates error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/report/template/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute('SELECT * FROM report_template WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.json({ code: 404, message: '模板不存在' });
        }
        
        const template = rows[0];
        res.json({ 
            code: 200, 
            data: {
                ...template,
                fields: template.fields ? JSON.parse(template.fields) : [],
                filters: template.filters ? JSON.parse(template.filters) : {}
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get report template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/report/template', async (req, res) => {
    try {
        const { name, type, fields, filters, layout } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO report_template (name, type, fields, filters, layout, status, create_time) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [name, type, JSON.stringify(fields), JSON.stringify(filters), layout || 'table']
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '模板保存成功' });
    } catch (error) {
        console.error('Save report template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/report/template/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM report_template WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '模板删除成功' });
    } catch (error) {
        console.error('Delete report template error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;