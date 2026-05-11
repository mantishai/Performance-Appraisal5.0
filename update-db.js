import pool from './server/db.js';

async function updateDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 检查并添加 employee_no 字段
        const [columns] = await connection.execute(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'hr_system' AND table_name = 'user' AND column_name = 'employee_no'
        `);
        if (columns.length === 0) {
            await connection.execute(`
                ALTER TABLE user 
                ADD COLUMN employee_no VARCHAR(20) DEFAULT NULL COMMENT '关联工号（员工用户有值，非员工为NULL）'
            `);
            console.log('✅ 添加 employee_no 字段');
        } else {
            console.log('ℹ️ employee_no 字段已存在');
        }
        
        // 检查并添加 display_name 字段
        const [displayColumns] = await connection.execute(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'hr_system' AND table_name = 'user' AND column_name = 'display_name'
        `);
        if (displayColumns.length === 0) {
            await connection.execute(`
                ALTER TABLE user 
                ADD COLUMN display_name VARCHAR(50) NOT NULL DEFAULT '' COMMENT '显示名称'
            `);
            console.log('✅ 添加 display_name 字段');
        } else {
            console.log('ℹ️ display_name 字段已存在');
        }
        
        // 更新现有数据的 display_name
        await connection.execute(`UPDATE user SET display_name = COALESCE(real_name, username) WHERE display_name = ''`);
        
        // 给admin用户设置display_name
        await connection.execute(`UPDATE user SET display_name = '管理员' WHERE username = 'admin'`);
        
        // 更新现有员工用户的 employee_no
        await connection.execute(`
            UPDATE user u
            JOIN employee e ON u.employee_id = e.id
            SET u.employee_no = e.employee_no
            WHERE u.employee_id IS NOT NULL
        `);
        
        await connection.commit();
        console.log('\n✅ 用户表更新完成');
        
        // 检查更新结果
        const [users] = await connection.execute('SELECT id, username, display_name, employee_no, real_name FROM user');
        console.log('\n更新后的用户数据:');
        users.forEach(user => {
            console.log(`ID: ${user.id}, 用户名: ${user.username}, 显示名: ${user.display_name}, 工号: ${user.employee_no || '无'}`);
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ 更新失败:', error.message);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

updateDatabase();
