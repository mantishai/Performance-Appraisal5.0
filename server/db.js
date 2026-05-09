import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'hr_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;