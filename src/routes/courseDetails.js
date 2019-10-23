var express = require('express');
var router = express.Router({mergeParams: true});
const { Pool } = require('pg')
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function query (q, p) {
  const client = await pool.connect();
  let res;
  try {
    await client.query('BEGIN');
    try {
      res = await client.query(q, p);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } finally {
    client.release();
  }
  return res;
}

router.get('/', async function(req, res, next) {
    // Authentication
    if (!req.user) {
        req.flash('error','Login is required to access dashboard');
        return res.redirect('/login');
    }

    // Prepare SQL Statement
    var sql_query1 = "SELECT * FROM Courses WHERE c_code = $1";
    var sql_query2 = "SELECT * FROM CourseTeachingStaff WHERE c_code = $1";
    
    // Query
    try {
        const data1  = await query(sql_query1, [req.cid]);
        const data2 = await query(sql_query2, [req.cid]);

        res.render('courseDetails', {
            isCourse: req.isCourse,
            username: req.user.u_name,
            accountType: req.user.u_type,
            uid: req.user.u_id, 
            cid: req.cid,
            data: req.data,
            courseData: data1.rows,
            teachData: data2.rows
        });
    } catch (err) {
         //this will eventually be handled by your error handling middleware
        next(err);
    }
});

module.exports = router;
