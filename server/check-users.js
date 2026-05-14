import { createPool } from 'mysql2/promise';

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hr_system',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    timezone: '+08:00'
});

async function checkUsers() {
    console.log('检查系统用户...\n');

    try {
        const [users] = await pool.execute('SELECT * FROM user ORDER BY id');

        if (users.length === 0) {
            console.log('❌ 数据库中没有用户！');
            console.log('\n正在创建默认管理员账号...\n');

            await pool.execute(
                'INSERT INTO user (username, password, display_name, role, status, create_time) VALUES (?, ?, ?, ?, ?, NOW())',
                ['admin', '1', '系统管理员', 'super_admin', 1]
            );

            console.log('✅ 默认管理员账号创建成功！');
            console.log('\n📋 登录凭据：');
            console.log('   用户名: admin');
            console.log('   密码: 1\n');
        } else {
            console.log(`✅ 找到 ${users.length} 个用户：\n`);
            users.forEach(user => {
                console.log(`   ID: ${user.id}`);
                console.log(`   用户名: ${user.username}`);
                console.log(`   显示名: ${user.display_name || user.real_name || '-'}`);
                console.log(`   角色: ${user.role}`);
                console.log(`   状态: ${user.status === 1 ? '启用' : '禁用'}`);
                console.log('');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 查询失败:', error.message);
        process.exit(1);
    }
}

checkUsers();
