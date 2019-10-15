var express = require('express');
var router = express.Router({mergeParams: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

router.get('/', function(req, res, next) {
     // Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
    }
    
    var sql_query = `SELECT c.s_id, c.u_name, s.g_num, c.req_type
            FROM CourseEnrollments c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_id = s.c_id
            AND c.s_id = s.s_id
            WHERE c.c_id = \'${req.params.cid}\'
            ORDER BY c.req_type, c.s_id`;

	pool.query(sql_query, (err, data) => {
        res.render('groupsstudent', {
            isCourse: req.isCourse, 
            username: req.user.u_name,
            accountType: req.user.u_type,
            uid: req.user.u_id, 
            cid: req.cid,
            data: req.data,
            datarows: data.rows,
        });
    }); 
    
});

module.exports = router;