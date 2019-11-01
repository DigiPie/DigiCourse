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
		)
	`;
	if (req.user.u_type == 'Professor') {
		sql_query =  sql_query + `
			SELECT c_code, c_name FROM CourseManages CM WHERE p_id = $1 AND EXISTS (
				SELECT 1 FROM CurrentSemCourses C
				WHERE CM.c_code=C.c_code AND CM.c_year=C.c_year AND CM.c_sem=C.c_sem
			)`;
	} else {
		sql_query = sql_query + `
			SELECT c_code, c_name FROM CourseEnrollments CE WHERE s_id = $1 AND EXISTS (
				SELECT 1 FROM CurrentSemCourses C
				WHERE CE.c_code=C.c_code AND CE.c_year=C.c_year AND CE.c_sem=C.c_sem
			)`;
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