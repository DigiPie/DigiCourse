const sql_query = require('../sql');

const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

const authMiddleware = require('./middleware');
const antiMiddleware = require('./antimiddle');

// PostgreSQL Connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function findUser (u_username, callback) {
	pool.query(sql_query.query.select_user, [u_username], (err, data) => {
		if(err) {
			console.error("Unable to connect to database");
			return callback(null);
		}
		
		if(data.rows.length == 0) {
			console.error("User does not exist");
			return callback(null);
		} else if(data.rows.length == 1) {
			return callback(null, {
        u_username: data.rows[0].u_username,
        u_name: data.rows[0].u_name,
        u_type: data.rows[0].u_type,
        passwd_hash: data.rows[0].passwd,
			});
    }
    
    return callback(null);
	});
}

passport.serializeUser(function (user, cb) {
  cb(null, user.u_username);
})

passport.deserializeUser(function (u_username, cb) {
  findUser(u_username, cb);
})

function initPassport () {
  passport.use(new LocalStrategy(
    (u_username, passwd, done) => {
      findUser(u_username, (err, user) => {
        if (err) {
          return done(err);
        }

        // User not found
        if (!user) {
          console.error('User not found');
          return done(null, false);
        }

        // Always use hashed passwords and fixed time comparison
        bcrypt.compare(passwd, user.passwd_hash, (err, isValid) => {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            return done(null, false);
          }

          delete user.passwd_hash;
          return done(null, user);
        })
      })
    }
  ));

  passport.authMiddleware = authMiddleware;
  passport.antiMiddleware = antiMiddleware;
  passport.findUser = findUser;
}

module.exports = initPassport;
