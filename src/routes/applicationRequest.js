var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
	}

	res.render('applicationRequest', { 
		isCourse: false, 
		username: req.user.u_name,
		accountType: req.user.u_type, 
		uid: req.user.u_id
	});
});

module.exports = router;










