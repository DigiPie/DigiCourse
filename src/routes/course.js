var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

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
			data: data.rows 
		});
	});
});

module.exports = router;