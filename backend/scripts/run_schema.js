const fs = require('fs');
const path = require('path');
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
    
    // Drop and recreate
    await conn.query('DROP DATABASE IF EXISTS `sifga_db`');
    await conn.query('CREATE DATABASE `sifga_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conn.query('USE `sifga_db`');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    await conn.query(sql);
    console.log('Schema executed successfully');
    
    await conn.end();
    console.log('Done');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
