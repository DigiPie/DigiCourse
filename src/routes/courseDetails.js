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
        req.flash('error',`Login is required to access: '${req.originalUrl}'`);
        return res.redirect('/login');
    }

    // Prepare SQL Statement
    var sql_query1 = "SELECT * FROM CourseDetails WHERE c_code = $1";
    var sql_query2 = `
    SELECT * FROM (
    SELECT c_code, c_name, c_year, c_sem, p_id as t_id, u_name as name, 'Professor' as role FROM CourseManages
    UNION
    SELECT c_code, c_name, c_year, c_sem, s_id as t_id, u_name as name, 'Teaching Assistant' as role FROM CourseEnrollments
    WHERE req_type = 0) AS TeachingStaff
    WHERE c_code = $1 and c_year = $2 and c_sem = $3`;

    // Query
    try {
        const data1  = await query(sql_query1, [req.cid]);
        const data2 = await query(sql_query2, [req.cid, req.year, req.sem]);

        res.render('courseDetails', {
            isCourse: req.isCourse,
            username: req.user.u_name,
            accountType: req.user.u_type,
            uid: req.user.u_username, 
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
