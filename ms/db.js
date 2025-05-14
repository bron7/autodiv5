const mysql = require('mysql2');

// 创建连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'aA@15256758739', // 替换为你的密码
    database: 'qqmatchmachine',      // 替换为你创建的数据库名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试连接
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
    connection.release(); // 释放连接回连接池
});

module.exports = pool.promise();