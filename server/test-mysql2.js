import { createPool } from 'mysql2/promise';

console.log('开始测试数据库连接...');

try {
    const pool = createPool({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hr_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+08:00'
    });

    console.log('✅ 数据库连接池创建成功');

    pool.query('SELECT 1').then(() => {
        console.log('✅ 数据库查询测试成功');
        process.exit(0);
    }).catch(err => {
        console.error('❌ 数据库查询失败:', err.message);
        process.exit(1);
    });
} catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('错误类型:', error.code);
    console.error('错误详情:', error.stack);
    process.exit(1);
}
