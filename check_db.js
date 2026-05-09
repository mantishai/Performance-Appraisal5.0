import pool from './server/db.js';

async function checkDatabase() {
    console.log('开始检查数据库...\n');
    
    try {
        // 1. 检查数据库连接
        console.log('1. 检查数据库连接...');
        const connection = await pool.getConnection();
        console.log('   ✅ 数据库连接成功\n');
        connection.release();
        
        // 2. 检查有哪些表
        console.log('2. 检查数据库中的表...');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('   数据库中的表:');
        tables.forEach(t => {
            const tableName = Object.values(t)[0];
            console.log(`   - ${tableName}`);
        });
        console.log('');
        
        // 3. 检查 position 表结构
        console.log('3. 检查 position 表结构...');
        try {
            const [columns] = await pool.execute('DESCRIBE position');
            console.log('   position 表结构:');
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type}`);
            });
            console.log('');
        } catch (error) {
            console.log('   ⚠️ position 表不存在，需要初始化数据库');
            console.log(`   错误: ${error.message}\n`);
        }
        
        // 4. 检查 department 表
        console.log('4. 检查 department 表结构...');
        try {
            const [columns] = await pool.execute('DESCRIBE department');
            console.log('   department 表结构:');
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type}`);
            });
            console.log('');
        } catch (error) {
            console.log('   ⚠️ department 表不存在\n');
        }
        
        // 5. 检查 user 表
        console.log('5. 检查 user 表...');
        try {
            const [users] = await pool.execute('SELECT id, username, real_name, role FROM user LIMIT 5');
            console.log('   用户表中有数据:');
            users.forEach(u => {
                console.log(`   - ID: ${u.id}, 用户名: ${u.username}, 姓名: ${u.real_name}, 角色: ${u.role}`);
            });
            console.log('');
        } catch (error) {
            console.log('   ⚠️ user 表查询失败\n');
        }
        
        console.log('检查完成！');
    } catch (error) {
        console.error('数据库检查失败:', error);
    }
    
    process.exit(0);
}

checkDatabase();
