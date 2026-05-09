import pool from './db.js';

console.log('开始检测数据库连接...');

async function testDatabase() {
    try {
        // 测试连接
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功！');
        connection.release();

        // 检查数据库是否存在
        const [databases] = await pool.execute('SHOW DATABASES LIKE ?', ['hr_system']);
        if (databases.length === 0) {
            console.log('❌ 数据库 hr_system 不存在！请先运行 sql/database.sql 初始化数据库。');
            return;
        }
        console.log('✅ 数据库 hr_system 存在');

        // 检查表是否存在
        const [tables] = await pool.execute('SHOW TABLES LIKE ?', ['position']);
        if (tables.length === 0) {
            console.log('❌ position 表不存在！请先运行 sql/database.sql 初始化表。');
            return;
        }
        console.log('✅ position 表存在');

        // 检查表结构
        const [columns] = await pool.execute('DESCRIBE position');
        console.log('\nposition 表结构：');
        columns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`);
        });

        // 测试插入数据
        console.log('\n测试插入数据...');
        const testCode = `POS_TEST_${Date.now()}`;
        const [result] = await pool.execute(
            'INSERT INTO position (position_name, dept_id, position_level, headcount, position_code, status, create_time) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            ['测试岗位', 1, 'P5', 0, testCode]
        );
        console.log('✅ 测试插入成功，插入ID:', result.insertId);

        // 测试查询
        const [rows] = await pool.execute('SELECT * FROM position WHERE position_code = ?', [testCode]);
        console.log('✅ 查询结果:', rows);

        // 清理测试数据
        await pool.execute('DELETE FROM position WHERE id = ?', [result.insertId]);
        console.log('✅ 测试数据已清理');

        console.log('\n🎉 所有检测通过！数据库正常工作。');

    } catch (error) {
        console.error('❌ 数据库检测失败:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 请确保MySQL服务正在运行！');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 数据库用户名或密码错误！当前配置：user=root, password=root');
        }
    }

    process.exit(0);
}

testDatabase();