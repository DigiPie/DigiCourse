var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/

var sql_query = 'SELECT * FROM courses';
router.get('/', function(req, res, next) {
	pool.query(sql_query, (err, data) => {
		res.render('dashboard', { 
			isCourse: false, 
			username: "Name",
			accountType: "Student", 
			data: data.rows 
		});
	});
});

module.exports = router;