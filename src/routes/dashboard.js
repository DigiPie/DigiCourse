var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/

var sql_query = 'SELECT * FROM courses';
router.get('/', function(req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	pool.query(sql_query, (err, data) => {
		res.render('dashboard', { 
			isCourse: false, 
			username: req.user.u_id,
			accountType: req.user.u_type, 
			data: data.rows 
		});
	});
});

module.exports = router;