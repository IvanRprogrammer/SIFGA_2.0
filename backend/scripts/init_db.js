const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '7777',
      multipleStatements: true,
      connectTimeout: 10000
    });
    console.log('Connected to MySQL');
    await conn.query('CREATE DATABASE IF NOT EXISTS `sifga_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Database sifga_db created/ready');
    await conn.end();
    console.log('Done');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
