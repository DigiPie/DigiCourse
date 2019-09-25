var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/:ccode', function(req, res, next) {
	var sql_query = 'SELECT * FROM courses WHERE code=\'' + req.params.ccode + '\'';
	pool.query(sql_query, (err, data) => {
		res.render('course', {
			isCourse: true, 
			username: "Name",
			accountType: "Student", 
			data: data.rows 
		});
	});
});

module.exports = router;