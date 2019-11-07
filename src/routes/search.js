var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Re route to dashboard instead
    res.redirect('/dashboard');
});

router.post('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error',`Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
	}

	if (req.body.searchBox == '') {
		res.render('search', {
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_username,
			dataNum: 0,
			searchPhrase: req.body.searchBox
		});
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
		SELECT * FROM CurrentSemCourses NATURAL JOIN CourseDetails
		WHERE LOWER(c_name) LIKE LOWER($1) OR LOWER(c_code) LIKE LOWER($1)
	`;

	// Query
	pool.query(sql_query, ['%' + req.body.searchBox + '%'], (err, data) => {
		res.render('search', {
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_username,
			datarows: data.rows,
			dataNum: data.rowCount,
			searchPhrase: req.body.searchBox
		});
	});
});

module.exports = router;