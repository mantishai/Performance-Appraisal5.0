import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/archive/tables', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: [
                { name: 'employee', label: '员工表', count: 0 },
                { name: 'attendance_record', label: '考勤记录表', count: 0 },
                { name: 'leave_request', label: '请假申请表', count: 0 },
                { name: 'performance_evaluation', label: '绩效评估表', count: 0 },
                { name: 'training_record', label: '培训记录表', count: 0 }
            ], 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get archive tables error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/archive/preview', async (req, res) => {
    try {
        const { tableName, dateRange } = req.body;
        
        res.json({ 
            code: 200, 
            data: {
                totalCount: 0,
                previewData: [],
                columns: []
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Preview archive error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/archive/execute', async (req, res) => {
    try {
        const { tableName, dateRange, archiveName } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO archive_record (table_name, archive_name, record_count, status, create_time) VALUES (?, ?, 0, "archived", NOW())',
            [tableName, archiveName]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '归档执行成功' });
    } catch (error) {
        console.error('Execute archive error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/archive/records', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM archive_record ORDER BY create_time DESC');
        
        const records = rows.map(row => ({
            id: row.id,
            tableName: row.table_name,
            archiveName: row.archive_name,
            recordCount: row.record_count,
            status: row.status || 'archived',
            createTime: row.create_time,
            restoreTime: row.restore_time
        }));
        
        res.json({ code: 200, data: records, message: 'success' });
    } catch (error) {
        console.error('Get archive records error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/archive/restore/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'UPDATE archive_record SET status = ?, restore_time = NOW() WHERE id = ?',
            ['restored', id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '归档恢复成功' });
    } catch (error) {
        console.error('Restore archive error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;