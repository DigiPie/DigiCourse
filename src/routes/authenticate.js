var express = require('express');
var sql_query = require('../sql');
var passport = require('passport');
var bcrypt = require('bcrypt')
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

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

router.get('/', function (req, res, next) {
  // If user is already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect('/dashboard');
  } else {
    return res.redirect('/login');
  }
});

router.get('/login', function (req, res, next) {
  // If user is already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect('/dashboard');
  }

  req.flash('info', 'User: A0000001A\nPassword: DatabaseSystem');
  res.render('login');
});


module.exports = router;