var express = require('express');
var router = express.Router();

const { Pool } = require('pg');
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

	// Professor no need to reach here
	if (req.user.u_type == 'Professor') {
		return res.redirect('/applicationStatus');
	}

	// Prepare SQL Statement
	// select all courses that the user has not enrolled in before for this year and sem
	//			AND there must no pending request for these courses
	// 				enrolled: pid=not null + req_status=True
	//				pending: pid=null + req_status=False
	// select all courses that user can be a TA
	// 		AND user must have enrolled into the course before and is not currently enrolled into
	//		AND there is no pending/rejected request to be a TA for course this year and sem
	// 		AND user can be a TA even if he have been a TA before
	// 				applyingTA: pid=null + req_status=False 
	var sql_query = `
		WITH CurrentSemCourses AS (
			SELECT c_code, c_year, c_sem, c_capacity
			FROM CourseYearSem NATURAL JOIN (
				SELECT c_year, c_sem 
				FROM CourseYearSem
				GROUP BY c_year, c_sem
				ORDER BY c_year DESC, c_sem DESC
				LIMIT 1 
				) AS yearsem
		),
		CourseRequestForUser AS (
			SELECT C.c_code, C.c_year, C.c_sem, False AS canbe_ta
			FROM CurrentSemCourses C 				
			WHERE NOT EXISTS (						
				SELECT 1 FROM Enrollments E
				WHERE E.s_id=$1 AND E.c_code=C.c_code AND E.req_type=1				
					AND ((E.p_id IS NOT NULL AND E.req_status=True) 						
						OR (E.req_status=False AND E.c_year=C.c_year AND E.c_sem=C.c_sem))  
			)
			UNION
			SELECT C.c_code, C.c_year, C.c_sem, True AS canbe_ta
			FROM CurrentSemCourses C LEFT JOIN Enrollments E
				ON C.c_code=E.c_code AND C.c_year=E.c_year AND C.c_sem=E.c_sem		
			WHERE E.req_type IS NULL 												
				AND EXISTS (
					SELECT 1 FROM Enrollments F
					WHERE F.s_id=$1 AND F.c_code=C.c_code AND F.req_type=1	
						AND F.p_id IS NOT NULL AND F.req_status=True
			)
		)
		SELECT c_code, c_name, canbe_ta 
		FROM CourseRequestForUser NATURAL JOIN CourseDetails
		ORDER BY c_code, canbe_ta`;

	// Query
	pool.query(sql_query, [req.user.u_username], (err, data) => {
		res.render('applicationRequest', {
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
	// Handle redirection
	if (req.body.searchBox) {
		// Prepare SQL Statement
		// same as above except there is filtering
		var sql_query = `
		WITH CurrentSemCourses AS (
			SELECT c_code, c_year, c_sem, c_capacity
			FROM CourseYearSem NATURAL JOIN (
				SELECT c_year, c_sem 
				FROM CourseYearSem
				GROUP BY c_year, c_sem
				ORDER BY c_year DESC, c_sem DESC
				LIMIT 1 
				) AS yearsem
		),
		CourseRequestForUser AS (
			SELECT C.c_code, C.c_year, C.c_sem, False AS canbe_ta
			FROM CurrentSemCourses C 				
			WHERE NOT EXISTS (						
				SELECT 1 FROM Enrollments E
				WHERE E.s_id=$1 AND E.c_code=C.c_code AND E.req_type=1				
					AND ((E.p_id IS NOT NULL AND E.req_status=True) 						
						OR (E.req_status=False AND E.c_year=C.c_year AND E.c_sem=C.c_sem))  
			)
			UNION
			SELECT C.c_code, C.c_year, C.c_sem, True AS canbe_ta
			FROM CurrentSemCourses C LEFT JOIN Enrollments E
				ON C.c_code=E.c_code AND C.c_year=E.c_year AND C.c_sem=E.c_sem		
			WHERE E.req_type IS NULL 												
				AND EXISTS (
					SELECT 1 FROM Enrollments F
					WHERE F.s_id=$1 AND F.c_code=C.c_code AND F.req_type=1	
						AND F.p_id IS NOT NULL AND F.req_status=True
			)
		)
		SELECT c_code, c_name, canbe_ta 
		FROM CourseRequestForUser NATURAL JOIN CourseDetails
		WHERE LOWER(c_name) LIKE LOWER($2) OR LOWER(c_code) LIKE LOWER($2)
		ORDER BY c_code, canbe_ta`; 

		// Query
		pool.query(sql_query, [req.user.u_username, "%" + req.body.searchBox + "%"], (err, data) => {
			res.render('applicationRequest', {
				isCourse: false, 
				username: req.user.u_name,
				accountType: req.user.u_type, 
				uid: req.user.u_username,
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
		var sql_query = "INSERT INTO Enrollments VALUES ($1, $2, $3, $4, $5, NOW(), NULL, False)";

		const current_year_sem_query = `
		SELECT c_year, c_sem
		FROM CourseYearSem
		GROUP BY c_year, c_sem
		ORDER BY c_year DESC, c_sem ASC
		LIMIT 1`;

		// Query
		pool.query(current_year_sem_query, (err1, cdata) => {
			year = cdata.rows[0].c_year;
			sem = cdata.rows[0].c_sem;

			pool.query(sql_query, [req.user.u_username, cid, year, sem, type], (err, data) => {
				if (err) {
					req.flash('error', 'Error. Please try again');
					res.status(err.status || 500).redirect('back');
				} else {
					req.flash('success', 'Successfully submitted Request');
					res.status(200).redirect('/applicationRequest');
				}
			});
		});
	}
});

module.exports = router;










