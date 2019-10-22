var express = require('express');
var router = express.Router();
var forum = require('./forum');
const enrollments = require('./enrollments');
const groups = require('./groups');
const details = require('./courseDetails');
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var courseName;
var year;
var sem;

/**** Routing ****/
router.get('/:cid', function(req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	// Prepare SQL Statement
	//var sql_query = `SELECT * FROM courses WHERE c_id =\'${req.params.cid}\'`;
	var sql_query;
	if (req.user.u_type == 'Professor') {
		sql_query = 'SELECT C.c_id, C.c_name, (SELECT COUNT(*) > 0 FROM CourseManages CM WHERE CM.c_id = C.c_id AND CM.p_id = $1) AS user_can_see FROM Courses C WHERE C.c_id = $2';
	} else {
		sql_query = "SELECT C.c_id, C.c_name, (SELECT COUNT(*) > 0 FROM CourseEnrollments CE WHERE CE.c_id = C.c_id AND CE.s_id = $1) AS user_can_see FROM Courses C WHERE C.c_id = $2";
	}

	const current_year_sem_query = 
		`SELECT c_year, c_sem
		FROM CourseYearSem
		GROUP BY c_year, c_sem
		ORDER BY c_year DESC, c_sem ASC
		LIMIT 1;`

	// Query
	pool.query(current_year_sem_query, (err1, cdata) => {
		year = cdata.rows[0].c_year;
		sem = cdata.rows[0].c_sem;

		pool.query(sql_query, [req.user.u_id, req.params.cid], (err, data) => {
			courseName = data.rows;

			res.render('course', {
				isCourse: true, 
				username: req.user.u_name,
				accountType: req.user.u_type, 
				uid: req.user.u_id,
				cid: req.params.cid,
				data: data.rows,
			});
		});
	});
});

router.use('/:cid/details', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	req.year = year;
	req.sem = sem;
	next()
}, details);

router.use('/:cid/forum', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	req.year = year;
	req.sem = sem;
	next()
}, forum);

router.use('/:cid/enrollments', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	req.year = year;
	req.sem = sem;
	next()
}, enrollments);

router.use('/:cid/groups', function(req, res, next) {		
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	req.year = year;
	req.sem = sem;
	next()
}, groups);

module.exports = router;