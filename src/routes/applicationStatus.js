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
		req.flash('error',`Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
	}

	// Prepare SQL Statement
	var sql_query;
	if (req.user.u_type == 'Professor') {
		sql_query = `
			WITH CurrentSemCourses AS (
				SELECT c_code, c_year, c_sem, c_capacity
				FROM CourseYearSem NATURAL JOIN (
					SELECT c_year, c_sem 
					FROM CourseYearSem
					GROUP BY c_year, c_sem
					ORDER BY c_year DESC, c_sem DESC
					LIMIT 1 
				) AS yearsem
			)
			SELECT A.u_name AS studentname, S.s_id, CD.c_code, CD.c_name, TO_CHAR(E.req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') AS req_datetime, E.req_type, E.req_status, E.p_id AS approver
			FROM Enrollments E NATURAL JOIN CourseDetails CD NATURAL JOIN Students S JOIN Accounts A ON E.s_id = A.u_username
			WHERE EXISTS (
				SELECT 1 FROM CurrentSemCourses C NATURAL JOIN Manages M
				WHERE E.c_code=C.c_code AND E.c_year=C.c_year AND E.c_sem=C.c_sem
					AND p_id = $1
			)
			ORDER BY c_code, req_status, approver`;
	} else {
		sql_query = `
			WITH CurrentSemCourses AS (
				SELECT c_code, c_year, c_sem, c_capacity
				FROM CourseYearSem NATURAL JOIN (
					SELECT c_year, c_sem 
					FROM CourseYearSem
					GROUP BY c_year, c_sem
					ORDER BY c_year DESC, c_sem DESC
					LIMIT 1 
				) AS yearsem
			)
			SELECT A.u_name AS studentname, S.s_id, CD.c_code, CD.c_name, TO_CHAR(E.req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') AS req_datetime, E.req_type, E.req_status, E.p_id AS approver
			FROM Enrollments E NATURAL JOIN CourseDetails CD NATURAL JOIN Students S JOIN Accounts A ON E.s_id = A.u_username
			WHERE EXISTS (
				SELECT 1 FROM CurrentSemCourses C
				WHERE E.c_code=C.c_code AND E.c_year=C.c_year AND E.c_sem=C.c_sem
			) AND S.s_id=$1
			ORDER BY c_code, req_status, approver`;
	}

	// Query
	pool.query(sql_query, [req.user.u_username] , (err, data) => {
		res.render('applicationStatus', { 
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_username,
			datarows: data.rows,
			dataNum: data.rowCount
		});
	});
});

router.post('/', function(req, res, next) {
	// Retrieve Information
	var sql_query;
	var cid = req.body.c_code;
	var sid = req.body.s_id;
	var req_dt = req.body.req_dt;

	// handle redirection
	if (req.body.cancel) {
		// Prepare SQL Statement
		//sql_query = "DELETE FROM Enrollments WHERE s_id = $1 AND c_code = $2 AND TO_CHAR(req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $3";
		sql_query = "DELETE FROM Enrollments WHERE s_id = $1 AND c_code = $2 AND TO_CHAR(req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $3";
	
		// Query
		pool.query(sql_query, [sid, cid, req_dt], (err, data) => {
			if (err) {
				req.flash('error', 'Error. Please try again');
				res.status(err.status || 500).redirect('back');
			} else {
				req.flash('success', 'Successfully cancelled application');
				res.status(200).redirect('/applicationStatus');
			}
		});
	} else if (req.body.searchBox) {
		// Prepare SQL Statement
		var sql_query;
		if (req.user.u_type == 'Professor') {
			sql_query = `
				WITH CurrentSemCourses AS (
					SELECT c_code, c_year, c_sem, c_capacity
					FROM CourseYearSem NATURAL JOIN (
						SELECT c_year, c_sem 
						FROM CourseYearSem
						GROUP BY c_year, c_sem
						ORDER BY c_year DESC, c_sem DESC
						LIMIT 1 
					) AS yearsem
				)
				SELECT A.u_name AS studentname, S.s_id, CD.c_code, CD.c_name, TO_CHAR(E.req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') AS req_datetime, E.req_type, E.req_status, E.p_id AS approver
				FROM Enrollments E NATURAL JOIN CourseDetails CD NATURAL JOIN Students S JOIN Accounts A ON E.s_id = A.u_username
				WHERE EXISTS (
					SELECT 1 FROM CurrentSemCourses C NATURAL JOIN Manages M
					WHERE E.c_code=C.c_code AND E.c_year=C.c_year AND E.c_sem=C.c_sem
						AND p_id = $1
				) AND LOWER(c_name) LIKE LOWER($2) OR LOWER(c_code) LIKE LOWER($2)
				ORDER BY c_code, req_status, approver`;
		} else {
			sql_query = `
				WITH CurrentSemCourses AS (
					SELECT c_code, c_year, c_sem, c_capacity
					FROM CourseYearSem NATURAL JOIN (
						SELECT c_year, c_sem 
						FROM CourseYearSem
						GROUP BY c_year, c_sem
						ORDER BY c_year DESC, c_sem DESC
						LIMIT 1 
					) AS yearsem
				)
				SELECT A.u_name AS studentname, S.s_id, CD.c_code, CD.c_name, TO_CHAR(E.req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') AS req_datetime, E.req_type, E.req_status, E.p_id AS approver
				FROM Enrollments E NATURAL JOIN CourseDetails CD NATURAL JOIN Students S JOIN Accounts A ON E.s_id = A.u_username
				WHERE EXISTS (
					SELECT 1 FROM CurrentSemCourses C
					WHERE E.c_code=C.c_code AND E.c_year=C.c_year AND E.c_sem=C.c_sem
				) AND S.s_id=$1 AND (LOWER(c_name) LIKE LOWER($2) OR LOWER(c_code) LIKE LOWER($2))
				ORDER BY c_code, req_status, approver`;
		}

		// Query
		pool.query(sql_query, [req.user.u_username, "%" + req.body.searchBox + "%"], (err, data) => {
			res.render('applicationStatus', { 
				isCourse: false, 
				username: req.user.u_name,
				accountType: req.user.u_type, 
				uid: req.user.u_username,
				datarows: data.rows,
				dataNum: data.rowCount
			});
		});
	} else {
		return res.redirect('/course/' + cid);
	}

});

module.exports = router;










