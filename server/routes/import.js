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