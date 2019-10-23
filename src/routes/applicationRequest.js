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

	// Professor no need to reach here
	if (req.user.u_type == 'Professor') {
		return res.redirect('/applicationStatus');
	}

	// Prepare SQL Statement
	var sql_query = "SELECT C.c_code, C.c_name, (SELECT COUNT(*)=1 FROM Enrollments E WHERE E.c_code = C.c_code AND E.req_status=True AND E.p_id IS NOT NULL AND E.s_id = $1) AS enrolled FROM Courses C, Students S WHERE S.s_id = $1 AND NOT EXISTS (SELECT 1 FROM Enrollments E2 WHERE E2.c_code = C.c_code AND E2.s_id = S.s_id AND E2.req_status = False) ORDER BY enrolled";
	// CHECK if user is a student
			// SELECT COUNT(*) = 1 FROM Students WHERE s_id = 'A0000001A';
	// SELECT ALL Courses that the user has enrolled in
			// SELECT c_code FROM Enrollments WHERE s_id = 'A0000001A' AND req_status = True AND p_id IS NOT NULL;
	// SELECT ALL Courses that the user has not enrolled in
			// SELECT c_code FROM Courses EXCEPT SELECT c_code FROM Enrollments WHERE s_id = 'A0000001A' AND req_status = True AND p_id IS NOT NULL;
			// SELECT C.c_code FROM Courses C WHERE NOT EXISTS (SELECT 1 FROM Enrollments E WHERE E.c_code = C.c_code AND E.req_status=True AND E.s_id = 'A0000001A');

	// Query
	pool.query(sql_query, [req.user.u_id], (err, data) => {
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

router.post('/', function(req, res, next) {
	// Handle redirection
	if (req.body.searchBox) {
		// Prepare SQL Statement
		var sql_query = "SELECT C.c_code, C.c_name, (SELECT COUNT(*)=1 FROM Enrollments E WHERE E.c_code = C.c_code AND E.req_status=True AND E.p_id IS NOT NULL AND E.s_id = $1) AS enrolled FROM Courses C, Students S WHERE S.s_id = $1 AND (LOWER(c_name) LIKE LOWER($2) OR LOWER(c_code) LIKE LOWER($2)) ORDER BY enrolled";

		// Query
		pool.query(sql_query, [req.user.u_id, "%" + req.body.searchBox + "%"], (err, data) => {
			res.render('applicationRequest', {
				isCourse: false, 
				username: req.user.u_name,
				accountType: req.user.u_type, 
				uid: req.user.u_id,
				datarows: data.rows,
				dataNum: data.rowCount
			});
		});
	} else {
		// Retrieve Information
		var cid = req.body.c_code;
		var type = -1;
		if (req.body.TA_req) {
			type = 0;
		} else if (req.body.C_req) {
			type = 1;
		}

		// Prepare SQL Statement
		var sql_query = "INSERT INTO Enrollments VALUES ($1, $2, $3, NOW(), NULL, False)";

		// Query
		pool.query(sql_query, [req.user.u_id, cid, type], (err, data) => {
			if (err) {
				req.flash('error', 'Error. Please try again');
				res.status(err.status || 500).redirect('back');
			} else {
				req.flash('success', 'Successfully submitted Request');
				res.status(200).redirect('/applicationRequest');
			}
		});
	}
});

module.exports = router;










