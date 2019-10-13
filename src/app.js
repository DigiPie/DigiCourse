var session = require('express-session');
var createError = require('http-errors');
var express = require('express');
var flash = require('express-flash');
var passport = require('passport');
var request = require('request');
var session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var port = process.env.PORT || 3000;
var logger = require('morgan');

/* --- V7: Using dotenv     --- */
require('dotenv').config();

var usersRouter = require('./routes/users');

/* --- V2: Adding Web Pages --- */
var aboutRouter = require('./routes/about');
/* ---------------------------- */

/* --- V3: Basic Template   --- */
var tableRouter = require('./routes/table');
var loopsRouter = require('./routes/loops');
/* ---------------------------- */

/* --- V4: Database Connect --- */
var selectRouter = require('./routes/select');
/* ---------------------------- */

/* --- V5: Adding Forms     --- */
var formsRouter = require('./routes/forms');
/* ---------------------------- */

/* --- V6: Modify Database  --- */
var insertRouter = require('./routes/insert');
/* ---------------------------- */

/* --- course template --- */
var dashboardRouter = require('./routes/dashboard');
var courseRouter = require('./routes/course');

/* --- Authentication router  --- */
var authRouter = require('./routes/authenticate');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

// Body parser init
app.use(bodyParser.urlencoded({
  extended: false
}));

// Authentication
require('./auth').init(app);
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/users', usersRouter);

/* --- V2: Adding Web Pages --- */
app.use('/about', aboutRouter);
/* ---------------------------- */

/* --- V3: Basic Template   --- */
app.use('/table', tableRouter);
app.use('/loops', loopsRouter);
/* ---------------------------- */

/* --- V4: Database Connect --- */
app.use('/select', selectRouter);
/* ---------------------------- */

/* --- V5: Adding Forms     --- */
app.use('/forms', formsRouter);
/* ---------------------------- */

/* --- V6: Modify Database  --- */
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/insert', insertRouter);
/* ---------------------------- */

/* course template */
app.use('/dashboard', dashboardRouter);
app.use('/course', courseRouter);

/* Login/logout handling */
app.use('/', authRouter);
app.use('/login', authRouter);
app.use('/logout', authRouter);

/* Error handling */
// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals
  if (err.status == 404) {
    res.locals.err_status = "Error: 404";
    res.locals.err_msg = "Page not found.";
  } else if (app.get('env') === 'development') {
    res.locals.err_status = "Error";
    res.locals.err_msg = err.message;
  } else {
    res.locals.err_status = "Error";
    res.locals.err_msg = "Unexpected error occurred.";
  }

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
