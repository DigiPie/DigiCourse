/*
 * Module dependencies.
 */
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const flash = require('express-flash');
const passport = require('passport');
const path = require('path');
const session = require('express-session');
const logger = require('morgan');
require('dotenv').config();

/*
 * Routers
 */
let authRouter = require('./routes/authenticate');

let applicationRequestRouter = require('./routes/applicationRequest');
let applicationStatusRouter = require('./routes/applicationStatus');
let courseRouter = require('./routes/course');
let dashboardRouter = require('./routes/dashboard');
let searchRouter = require('./routes/search');

/*
 * View engine setup
 */ 
let app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

require('./auth').init(app);
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
 * Routing
 */ 
app.use('/dashboard', dashboardRouter);
app.use('/course', courseRouter);
app.use('/search', searchRouter);
app.use('/applicationRequest', applicationRequestRouter);
app.use('/applicationStatus', applicationStatusRouter);
/* Login/logout handling */
app.use('/', authRouter);
app.use('/login', authRouter);
app.use('/logout', authRouter);

/*
 * Error handling
 */ 
// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals
  if (err.status == 404) {
    res.locals.err_status = 'Error: 404';
    res.locals.err_msg = 'Page not found.';
  } else if (app.get('env') === 'development') {
    res.locals.err_status = 'Error';
    res.locals.err_msg = err.message;
  } else {
    res.locals.err_status = 'Error';
    res.locals.err_msg = 'Unexpected error occurred.';
  }

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;