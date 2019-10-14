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
		res.render('applicationStatus', { 
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_id,
			datarows: data.rows,
			dataNum: data.rowCount
		});
	});
});

/*
router.post('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	// Construct SQL Query
	var sql_query;
	var cid = req.body.c_id;
	var sid = req.body.s_id;
	var req_dt = req.body.req_dt;
	var approver = req.user.u_id;

	if (req.body.approve) {
		sql_query = "UPDATE Enrollments SET p_id = $4, req_status = TRUE WHERE s_id = $1 AND c_id = $2 AND req_datetime = $3";
	} else if (req.body.reject) {
		sql_query = "UPDATE Enrollments SET p_id = $4, req_status = FALSE WHERE s_id = $1 AND c_id = $2 AND req_datetime = $3";
	} else {
		sql_query = "DELETE FROM Enrollments WHERE s_id = $1 AND c_id = $2 AND req_datetime = $3";
	}

	console.log(req_dt);

	// Query
	pool.query(sql_query, [sid, cid, req_dt], (err, data) => {
		if (err) {
			console.log(err);
		} else {
			console.log("SUCCESS");
		}

		res.redirect('/applicationStatus')
	});
});
*/

module.exports = router;










