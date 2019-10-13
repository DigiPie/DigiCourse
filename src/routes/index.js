var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // If user is already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect('/dashboard');
  } else {
    return res.redirect('/login');
  }
});

module.exports = router;
