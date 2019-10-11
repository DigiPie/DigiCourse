var express = require('express');
var router = express.Router();
var forum = require('./forum');

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var courseName;

/**** Routing ****/
router.get('/:cid', function(req, res, next) {
	var sql_query = `SELECT * FROM courses WHERE c_id =\'${req.params.cid}\'`;
	console.log("ccode "+ req.params.cid)
	pool.query(sql_query, (err, data) => {
		console.log (data.rows);
		res.render('course', {
			isCourse: true, 
			username: "Name",
			accountType: "Student",
			cid: req.params.cid,
			data: data.rows 
		});
		courseName = data.rows;
	});
});

router.use('/:cid/forum', function(req, res, next) {
	req.isCourse = true, 
	req.username = "Name",
	req.accountType = "Student",
	req.cid = req.params.cid;
	req.data = courseName;
	next()
}, forum);

module.exports = router;