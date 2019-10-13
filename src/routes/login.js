var express = require('express');
var sql_query = require('../sql');
var passport = require('passport');
var bcrypt = require('bcrypt')
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/* Login */
router.post('/', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) { 
      return next(err); 
    }

    if (!user) { 
      req.flash('error','Invalid username or password');
      return res.redirect('/login'); 
    }

    req.logIn(user, function (err) {
      if (err) { 
        return next(err); 
      }
      
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('login');
});

module.exports = router;