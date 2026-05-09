import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// 获取待办任务列表
router.get('/todos', async (req, res) => {
    try {
        const { userId } = req.query;
        
        let query = `
            SELECT * FROM todo_task 
            WHERE 1=1
        `;
        const params = [];
        
        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        
        query += ' ORDER BY priority DESC, deadline ASC, create_time DESC';
        
        const [rows] = await pool.execute(query, params);
        
        // 转换字段名以匹配前端期望
        const todos = rows.map(row => ({
            id: row.id,
            title: row.task_title,
            content: row.task_content,
            type: row.task_type,
            priority: row.priority === 3 ? 'high' : row.priority === 2 ? 'medium' : 'low',
            status: row.status === 0 ? 'pending' : row.status === 1 ? 'completed' : 'ignored',
            completed: row.status === 1,
            createTime: row.create_time,
            dueTime: row.deadline,
            targetId: row.target_id
        }));
        
        res.json({ code: 200, data: todos, message: 'success' });
    } catch (error) {
        console.error('Get todos error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 创建待办任务
router.post('/todo', async (req, res) => {
    try {
        const { userId, taskType, taskTitle, taskContent, targetId, priority, deadline } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO todo_task (user_id, task_type, task_title, task_content, target_id, priority, deadline) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, taskType, taskTitle, taskContent, targetId, priority || 2, deadline]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: 'success' });
    } catch (error) {
        console.error('Create todo error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 更新待办任务状态
router.put('/todo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await pool.execute(
            'UPDATE todo_task SET status = ? WHERE id = ?',
            [status, id]
        );
        
        res.json({ code: 200, message: 'success' });
    } catch (error) {
        console.error('Update todo error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 删除待办任务
router.delete('/todo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM todo_task WHERE id = ?', [id]);
        
        res.json({ code: 200, message: 'success' });
    } catch (error) {
        console.error('Delete todo error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;
