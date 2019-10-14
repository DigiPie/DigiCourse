var express = require('express');
var router = express.Router();
var forum = require('./forum');
const enrollments = require('./enrollments');
const groups = require('./groups');
const details = require('./courseDetails');
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	multipleStatements: true
});

var courseName;

/**** Routing ****/
router.get('/:cid', function(req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	var sql_query = `SELECT * FROM courses WHERE c_id =\'${req.params.cid}\'`;
	pool.query(sql_query, (err, data) => {
		res.render('course', {
			isCourse: true, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_id,
			cid: req.params.cid,
			data: data.rows 
		});
		courseName = data.rows;
	});
});

router.use('/:cid/details', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	next()
}, details);

router.use('/:cid/forum', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	next()
}, forum);

router.use('/:cid/enrollments', function(req, res, next) {
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	next()
}, enrollments);

router.use('/:cid/groups', function(req, res, next) {		
	req.isCourse = true, 
	req.cid = req.params.cid;
	req.data = courseName;
	next()
}, groups);

module.exports = router;