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

try {
    console.log('测试部门表查询...');
    const [rows] = await pool.execute('DESCRIBE department');
    console.log('部门表结构:');
    console.log(rows);
    process.exit(0);
} catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
}
