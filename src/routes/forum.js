var express = require('express');
var router = express.Router({mergeParams: true})

const entries = require('./entries');
const forumsassign = require('./forumsassign');
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required');
		return res.redirect('/login');
    }

    // Checks whether the user is an approved TA of the course or a professor managing the course (to allow access to all forums in the course).
    var check_forum_privilege = 
    'SELECT u_id, CASE'
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Enrollments' 
    + '   WHERE s_id = $1' 
    + '   AND c_id = $2' 
    + '   AND req_type = 0' 
    + '   AND req_status = \'TRUE\''
    + ' ) = 1 THEN \'Teaching\''
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Manages' 
    + '   WHERE p_id = $1'
    + '   AND c_id = $2'
    + ' ) = 1 THEN \'Professor\''
	+ ' ELSE \'null\''
	+ ' END AS u_type'
	+ ' FROM Accounts'
    + ' WHERE u_id = $1';
        
    pool.query(check_forum_privilege, [req.user.u_id, req.cid], (err, result) => {
        if (result.rows.length != 1) {
            req.flash('error','Login is required');
            return res.redirect('/login');
        
        } else {
            var show_forums;

            if (result.rows[0].u_type == 'Teaching' || result.rows[0].u_type == 'Professor') {
                // Approved teaching assistants and the professor(s) managing the course are able to view all forums. 
                show_forums = 
                `SELECT f_topic, TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') formatted
                FROM Forums 
                WHERE c_id =\'${req.cid}\'
                ORDER BY f_datetime`;
            
            } else {
                // Students can only view the forums that are assigned to the group they belong in.
                show_forums = 
                `SELECT f_topic, TO_CHAR(f.f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') formatted
                FROM 
                ( StudentGroups sg JOIN ForumsGroups fg
                  ON sg.c_id = fg.c_id
                  AND sg.g_num = fg.g_num
                ) JOIN Forums f
                ON f.f_datetime = fg.f_datetime
                AND f.c_id = fg.c_id 
                WHERE fg.c_id =\'${req.cid}\'
                AND sg.s_id =\'${req.user.u_id}\'
                ORDER BY f.f_datetime`;
            }

            pool.query(show_forums, (err, forums) => {
                res.render('forum', {
                    isCourse: req.isCourse,
                    username: req.user.u_name,
                    accountType: req.user.u_type, 
                    cid: req.cid,
                    data: req.data,
                    forums: forums.rows
                });
            });
        }
    });
});

router.post('/create', function(req, res, next) {
    // Blank forum topic is not allowed.
    if (req.body.f_topic == '') {
        req.flash('error', 'Please enter a topic name for the new forum');
        res.redirect(`/course/${req.cid}/forum`);
        return;
    }

    var insert_new_forum = `INSERT INTO Forums VAlUES ('${req.user.u_id}', '${req.cid}', to_timestamp(${Date.now()} / 1000), '${req.body.f_topic}')`;

    pool.query(insert_new_forum, (err, data) => {
        if (err) {
            req.flash('error', 'Error. Please try again.');
            res.status(err.status || 500).redirect('back');
        } else {
            req.flash('success', `Successfully created forum "${req.body.f_topic}"`);
            res.status(200).redirect('back');
        }
    });
});

router.post('/delete/:f_topic/:f_datetime', function(req, res, next) {
    
    // Delete a forum from the course only if the user is a managing professor of the course.
    var delete_forum =
    'DELETE FROM Forums'
    + ' WHERE f_datetime = $1'
    + ' AND c_id = $2'
    + ' AND c_id IN'
    + ' ( SELECT m.c_id'
    + '   FROM Manages m'
    + '   WHERE p_id = $3'
    + ' )';

    pool.query(delete_forum, [req.params.f_datetime, req.cid, req.user.u_id], (err, data) => {
        if (err) {
            req.flash('delFail', 'Unable to delete forum. Please try again.');
            res.status(err.status || 500).redirect('back');
        } else {
            req.flash('delSuccess', `Successfully deleted forum "${req.params.f_topic}"`);
            res.status(200).redirect('back');
        }
    });
});

// Child routing for forum entries.
router.use('/:f_topic/:f_datetime/entries', function(req, res, next) {
    req.f_topic = req.params.f_topic;
    req.f_datetime = req.params.f_datetime;
	next()
}, entries);

// Child routing for forum assign.
router.use('/assign', function(req, res, next) {
	next()
}, forumsassign);

module.exports = router;