var express = require('express');
var router = express.Router({mergeParams: true})

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    var sql_query = `SELECT f_topic, TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') f_datetime 
    FROM Forums WHERE c_id =\'${req.cid}\'`;
	pool.query(sql_query, (err, forums) => {
		res.render('forum', {
			isCourse: req.isCourse,
			username: req.username,
			accountType: req.accountType, 
			cid: req.cid,
            data: req.data,
            forums: forums.rows
		});
	});
});


router.post('/create', function(req, res, next) {
    if (req.body.f_topic == '') {
        req.flash('error', `Please enter a topic name for the new forum`);
        res.redirect(`/course/${req.body.c_id}/forum`);
        return;
    }

    var query_pid = `SELECT p_id FROM Manages WHERE c_id =\'${req.body.c_id}\'`;
    pool.query(query_pid, (err, get_pid) => {
        var course_pid = get_pid.rows[0].p_id;

        var sql_query = `INSERT INTO Forums VAlUES ('${course_pid}', '${req.body.c_id}', to_timestamp(${Date.now()} / 1000.0), '${req.body.f_topic}')`;

        pool.query(sql_query, (err, data) => {
            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: "Something went wrong during the creation of forum, try again later.",
                    error: err
                });
            } else {
                req.flash('success', `Successfully created forum: "${req.body.f_topic}"`);
                res.status(200).redirect('back');
            }
        });
    });
    
});

module.exports = router;