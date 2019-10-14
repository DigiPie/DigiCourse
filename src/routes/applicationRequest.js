var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	// Prepare SQL Statement
	var sql_query;
	if (req.user.u_type == 'Professor') {
		sql_query = 'SELECT * FROM CourseApplications WHERE p_id = $1 ORDER BY req_status, approver DESC';
	} else {
		sql_query = "SELECT * FROM CourseApplications WHERE s_id = $1 ORDER BY req_status, approver DESC";
	}

	// Query
	pool.query(sql_query, [req.user.u_id] , (err, data) => {
		res.render('applicationRequest', { 
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_id,
			datarows: data.rows,
			dataNum: data.rowCount
		});
	});
});

module.exports = router;










