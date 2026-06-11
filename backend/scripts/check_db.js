process.stdout.write('Starting...\n');
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({host:'localhost', port:3307, user:'root', password:'7777', connectTimeout:5000});
    process.stdout.write('Connected\n');
    const [dbs] = await conn.query("SHOW DATABASES LIKE 'sifga_db'");
    if (dbs.length > 0) {
      await conn.query('USE sifga_db');
      const [tables] = await conn.query('SHOW TABLES');
      process.stdout.write('Tables: ' + tables.map(t => Object.values(t)[0]).join(', ') + '\n');
    } else {
      process.stdout.write('sifga_db does not exist\n');
    }
    await conn.end();
    process.exit(0);
  } catch (e) {
    process.stderr.write('Error: ' + e.message + '\n');
    process.exit(1);
  }
})();
