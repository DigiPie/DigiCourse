var express = require('express');
var router = express.Router({mergeParams: true})
const entries = require('./entries');
const forumsassign = require('./forumsassign');

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var forums_list;

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required');
		return res.redirect('/login');
    }

    var sql_query;
    if (req.user.u_type == 'Professor') {
        sql_query = 
        `SELECT f_topic, TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') f_datetime
        FROM Forums 
        WHERE c_id =\'${req.cid}\'`;
    }
    else {
        sql_query = 
        `SELECT f_topic, TO_CHAR(f.f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') f_datetime
        FROM (
            StudentGroups sg JOIN ForumsGroups fg
            ON sg.c_id = fg.c_id
            AND sg.g_num = fg.g_num) 
            JOIN Forums f
                ON f.f_datetime = fg.f_datetime
                AND f.c_id = fg.c_id 
            WHERE fg.c_id =\'${req.cid}\'
            AND sg.s_id =\'${req.user.u_id}\'`;
    }

	pool.query(sql_query, (err, forums) => {
		res.render('forum', {
			isCourse: req.isCourse,
			username: req.user.u_name,
			accountType: req.user.u_type, 
			cid: req.cid,
            data: req.data,
            forums: forums.rows
        });
        
        forums_list = forums.rows;
	});
});

router.use('/:f_topic/:f_datetime/entries', function(req, res, next) {
    req.f_topic = req.params.f_topic;
    req.f_datetime = req.params.f_datetime;
	next()
}, entries);

router.use('/assign', function(req, res, next) {
    req.forums_list = forums_list;
	next()
}, forumsassign);

router.post('/create', function(req, res, next) {
    // Empty topic name
    if (req.body.f_topic == '') {
        req.flash('error', `Please enter a topic name for the new forum`);
        res.redirect(`/course/${req.cid}/forum`);
        return;
    }

    var query_pid = `SELECT p_id FROM Manages WHERE c_id =\'${req.cid}\'`;
    
    pool.query(query_pid, (err, get_pid) => {
        var course_pid = get_pid.rows[0].p_id;
        var sql_query = `INSERT INTO Forums VAlUES ('${course_pid}', '${req.cid}', to_timestamp(${Date.now()} / 1000), '${req.body.f_topic}')`;

        pool.query(sql_query, (err, data) => {
            if (err) {
                req.flash('error', `Error. Please try again.`);
                res.status(err.status || 500).redirect('back');
            } else {
                req.flash('success', `Successfully created forum "${req.body.f_topic}"`);
                res.status(200).redirect('back');
            }
        });
    });
});

module.exports = router;