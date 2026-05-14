import { createPool } from 'mysql2/promise';

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hr_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM position');
    console.log('Connection successful! Position count:', rows[0].count);
    
    const [positions] = await pool.execute(`
        SELECT p.*, p.position_name as name, p.dept_id as departmentId,
               (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current,
               p.is_key_position as isKeyPosition,
               p.position_code as code,
               p.job_description as duties,
               p.requirement as requirements
        FROM \`position\` p
        LIMIT 5
    `);
    
    console.log('Sample position:', JSON.stringify(positions[0], null, 2));
    process.exit(0);
} catch (error) {
    console.error('Database error:', error);
    process.exit(1);
}
