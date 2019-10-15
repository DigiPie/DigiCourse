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
		sql_query = 'SELECT C.c_id, C.c_name, S.s_id, u_name, E.req_type, TO_CHAR(E.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') AS req_datetime , E.req_status, E.p_id AS approver FROM Enrollments E NATURAL JOIN Courses C NATURAL JOIN Students S JOIN Accounts ON s.s_id = u_id WHERE EXISTS (SELECT 1 FROM Manages M WHERE M.c_id = E.c_id AND M.p_id = $1) ORDER BY E.req_status, approver DESC';
	} else {
		sql_query = 'SELECT C.c_id, C.c_name, S.s_id, u_name, E.req_type, TO_CHAR(E.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') AS req_datetime, E.req_status, E.p_id AS approver FROM Enrollments E NATURAL JOIN Courses C NATURAL JOIN Students S JOIN Accounts ON s.s_id = u_id WHERE s_id = $1 ORDER BY E.req_status, approver DESC';
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

router.post('/', function(req, res, next) {
	// Retrieve Information
	var sql_query;
	var cid = req.body.c_id;
	var sid = req.body.s_id;
	var req_dt = req.body.req_dt;

	// handle redirection
	if (req.body.cancel) {
		// Prepare SQL Statement
		//sql_query = "DELETE FROM Enrollments WHERE s_id = $1 AND c_id = $2 AND TO_CHAR(req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $3";
		sql_query = "DELETE FROM Enrollments WHERE s_id = $1 AND c_id = $2 AND TO_CHAR(req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $3";
	
		// Query
		pool.query(sql_query, [sid, cid, req_dt], (err, data) => {
			res.redirect('/applicationStatus');
		});
	} else {
		return res.redirect('/course/' + cid);
	}

});

module.exports = router;










