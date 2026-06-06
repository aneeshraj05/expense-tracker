import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    const url = 'mysql://root:rGqHGSskcDDRNfjKffCDajIDEsfgnWQM@maglev.proxy.rlwy.net:13509/railway';
    const connection = await mysql.createConnection(url);
    console.log('✅ Connected!');
    connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
