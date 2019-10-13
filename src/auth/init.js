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

function findUser (u_id, callback) {
	pool.query(sql_query.query.select_user, [u_id], (err, data) => {
		if(err) {
			console.error("Cannot find user");
			return callback(null);
		}
		
		if(data.rows.length == 0) {
			console.error("User does not exists?");
			return callback(null)
		} else if(data.rows.length == 1) {
			return callback(null, {
				u_id    : data.rows[0].u_id,
				passwdHash: data.rows[0].passwd
			});
		} else {
			console.error("More than one user?");
			return callback(null);
		}
	});
}

passport.serializeUser(function (user, cb) {
  cb(null, user.u_id);
})

passport.deserializeUser(function (u_id, cb) {
  findUser(u_id, cb);
})

function initPassport () {
  passport.use(new LocalStrategy(
    (u_id, passwd, done) => {
      findUser(u_id, (err, user) => {
        if (err) {
          return done(err);
        }

        // User not found
        if (!user) {
          console.error('User not found');
          return done(null, false);
        }

        // Always use hashed passwords and fixed time comparison
        bcrypt.compare(passwd, user.passwdHash, (err, isValid) => {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            return done(null, false);
          }

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
