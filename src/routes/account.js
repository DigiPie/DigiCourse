let express = require('express');
let router = express.Router();
let passport = require('passport');
const bcrypt = require('bcrypt');
const sql_query = require('../sql');
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.post('/', function (req, res, next) {
	if (req.body.new_password == '' || req.body.new_password.length < 8) {
        req.flash('error', 'Please enter a password which is at least 8 characters long.');
        res.redirect('back');
        return;
	}

	if (req.body.new_password != req.body.new_password_check) {
        req.flash('error', 'New passwords do not match.');
        res.redirect('back');
        return;
	}
	
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}

		if (!user) {
			req.flash('error', `Current password is wrong.`);
			return res.redirect('back');
		}

		req.login(user, function (err) {
			if (err) {
				return next(err);
			}

			bcrypt.hash(req.body.new_password, 10, function(err, hash) {
				if (err) {
					console.error("Unable to hash password");
					return callback(null);
				}

				pool.query(sql_query.query.update_user_passwd, [hash, req.body.username], 
						(err, data) => {
					if (err) {
						console.error(`Unable to connect to database: ${err}`);
						return callback(null);
					}

					req.flash('success', `Successfully changed password.`);
					res.status(200).redirect('back');
				});
			});
		});
	})(req, res, next);
});

router.get('/', function (req, res, next) {
	// Authentication
	if (!req.user) {
		req.flash('error', `Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
	}

	res.render('account', {
		username: req.user.u_name,
		accountType: req.user.u_type,
		uid: req.user.u_username,
		isCourse: false
	});
});

module.exports = router;