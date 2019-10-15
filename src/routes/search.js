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
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	if (req.body.searchBox == '') {
		res.render('search', {
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_id,
			dataNum: 0,
			searchPhrase: req.body.searchBox
		});
    }

	 // Prepare SQL Statement
	var sql_query = "SELECT * FROM Courses WHERE LOWER(c_name) LIKE LOWER($1) OR LOWER(c_id) LIKE LOWER($1)";

	// Query
	pool.query(sql_query, ['%' + req.body.searchBox + '%'], (err, data) => {
		res.render('search', {
			isCourse: false, 
			username: req.user.u_name,
			accountType: req.user.u_type, 
			uid: req.user.u_id,
			datarows: data.rows,
			dataNum: data.rowCount,
			searchPhrase: req.body.searchBox
		});
	});
});

module.exports = router;