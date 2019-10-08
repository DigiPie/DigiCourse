var express = require('express');
var router = express.Router();
var forum = require('./forum');

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var courseName;

/**** Routing ****/
router.get('/:ccode', function(req, res, next) {
	var sql_query = 'SELECT * FROM courses WHERE code=\'' + req.params.ccode + '\'';
	pool.query(sql_query, (err, data) => {
		res.render('course', {
			isCourse: true, 
			username: "Name",
			accountType: "Student",
			ccode: req.params.ccode,
			data: data.rows 
		});
		courseName = data.rows;
	});
});

router.use('/:ccode/forum', function(req, res, next) {
	req.isCourse = true, 
	req.username = "Name",
	req.accountType = "Student",
	req.ccode = req.params.ccode;
	req.data = courseName;
	next()
}, forum);

module.exports = router;