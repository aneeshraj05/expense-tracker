import db from './config/db.js';

db.query('SELECT * FROM expenses LIMIT 1', (err, rows) => {
  if (err) console.error(err);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
