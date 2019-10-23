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
		sql_query = 'SELECT c_code, c_name FROM CourseManages WHERE p_id = $1';
	} else {
		sql_query = 'SELECT c_code, c_name FROM CourseEnrollments WHERE s_id = $1';
	}

	// Query
	pool.query(sql_query, [req.user.u_username] , (err, data) => {
		res.render('dashboard', { 
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_username,
			datarows: data.rows 
		});
	});
});

module.exports = router;