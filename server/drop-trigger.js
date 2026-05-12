import pool from './db.js';

async function dropTrigger() {
    try {
        console.log('正在删除触发器 employee_audit_update...');
        
        const connection = await pool.getConnection();
        
        await connection.query('DROP TRIGGER IF EXISTS employee_audit_update');
        
        console.log('✅ 触发器删除成功！');
        
        connection.release();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 删除触发器失败:', error.message);
        process.exit(1);
    }
}

dropTrigger();