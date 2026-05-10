import pool from './server/db.js';

async function updateAdminPassword() {
    console.log('正在更新admin用户密码...\n');
    
    try {
        // 更新密码为 '1'
        const [result] = await pool.execute(
            'UPDATE user SET password = ? WHERE username = ?',
            ['1', 'admin']
        );
        
        console.log(`✅ 更新成功！影响了 ${result.affectedRows} 条记录\n`);
        
        // 验证更新
        const [users] = await pool.execute(
            'SELECT id, username, real_name, role, status FROM user WHERE username = ?',
            ['admin']
        );
        
        if (users.length > 0) {
            const user = users[0];
            console.log('📋 用户信息：');
            console.log(`   ID: ${user.id}`);
            console.log(`   用户名: ${user.username}`);
            console.log(`   姓名: ${user.real_name}`);
            console.log(`   角色: ${user.role}`);
            console.log(`   状态: ${user.status === 1 ? '启用' : '禁用'}`);
        }
        
        console.log('\n✅ 完成！');
        console.log('现在可以使用以下凭据登录：');
        console.log('   用户名: admin');
        console.log('   密码: 1\n');
        
    } catch (error) {
        console.error('❌ 更新失败:', error.message);
        if (error.sql) {
            console.error('SQL语句:', error.sql);
        }
    }
    
    process.exit(0);
}

updateAdminPassword();
