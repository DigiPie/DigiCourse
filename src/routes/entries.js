var express = require('express');
var router = express.Router({mergeParams: true})

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    var sql_query = `SELECT u_id, TO_CHAR(e_datetime, 'Dy Mon DD YYYY HH24:MI:SS') e_datetime, e_content
    FROM ForumEntries WHERE c_id =\'${req.cid}\' and f_datetime =\'${req.forumDateTime}\'`;
	pool.query(sql_query, (err, entries) => {
		res.render('entries', {
			isCourse: req.isCourse,
			username: req.username,
			accountType: req.accountType, 
			cid: req.cid,
            data: req.data,
            entries: entries.rows
		});
	});
});

module.exports = router;