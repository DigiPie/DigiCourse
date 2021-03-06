var express = require('express');
var router = express.Router({mergeParams: true})

const entries = require('./entries');
const forumAssign = require('./forumAssign');
const forumUnassign = require('./forumUnassign');
const forumParticipation = require('./forumParticipation');
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required.');
		return res.redirect('/login');
    }

    // Checks whether the user is an approved TA of the course or a professor managing the course (to allow access to all forums in the course).
    var check_forum_privilege = 
    'SELECT u_username, CASE'
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Enrollments e' 
    + '   WHERE e.s_id = $1' 
    + '   AND e.c_code = $2' 
    + '   AND e.c_year = $3'
    + '   AND e.c_sem = $4'
    + '   AND e.req_type = 0' 
    + '   AND e.req_status = \'TRUE\''
    + ' ) = 1 THEN \'Teaching\''
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Manages m' 
    + '   WHERE m.p_id = $1'
    + '   AND m.c_code = $2'
    + '   AND m.c_year = $3'
    + '   AND m.c_sem = $4'
    + ' ) = 1 THEN \'Professor\''
	+ ' ELSE \'null\''
	+ ' END AS u_type'
	+ ' FROM Accounts'
    + ' WHERE u_username = $1';
        
    pool.query(check_forum_privilege, [req.user.u_username, req.cid, req.year, req.sem], (err, result) => {
        if (result.rows.length != 1) {
            req.flash('error','Login is required.');
            return res.redirect('/login');
        
        } else {
            var show_forums;

            if (result.rows[0].u_type == 'Teaching' || result.rows[0].u_type == 'Professor') {
                // Approved teaching assistants and the professor(s) managing the course are able to view all forums. 
                show_forums = 
                `SELECT f_topic, p_id, TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') formatted
                FROM Forums 
                WHERE c_code =\'${req.cid}\'
                AND c_year =\'${req.year}\'
                AND c_sem =\'${req.sem}\'
                ORDER BY f_datetime`;
            
            } else {
                // Students can only view the forums that are assigned to the group they belong in.
                show_forums = 
                `SELECT f.f_topic, f.p_id, TO_CHAR(f.f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') formatted
                FROM 
                ( StudentGroups sg JOIN ForumsGroups fg
                  ON sg.c_code = fg.c_code
                  AND sg.c_year = fg.c_year
                  AND sg.c_sem = fg.c_sem
                  AND sg.g_num = fg.g_num
                ) JOIN Forums f
                ON f.f_datetime = fg.f_datetime
                AND f.p_id = fg.p_id
                AND f.c_code = fg.c_code
                AND f.c_year = fg.c_year
                AND f.c_sem = fg.c_sem
                WHERE fg.c_code =\'${req.cid}\'
                AND fg.c_year =\'${req.year}\'
                AND fg.c_sem =\'${req.sem}\'
                AND sg.s_id =\'${req.user.u_username}\'
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
        req.flash('error', 'Please enter a topic name for the new forum.');
        res.redirect(`/course/${req.cid}/forum`);
        return;
    }

    var insert_new_forum = `INSERT INTO Forums VAlUES ('${req.user.u_username}', '${req.cid}', '${req.year}', '${req.sem}', NOW(), '${req.body.f_topic}')`;

    pool.query(insert_new_forum, (err, data) => {
        if (err || data.rowCount == 0) {
            req.flash('error', 'Error. Please try again.');
            res.status(500).redirect('back');

        } else {
            req.flash('success', `Successfully created forum "${req.body.f_topic}".`);
            res.status(200).redirect('back');
        }
    });
});

router.post('/delete/:f_topic/:f_datetime/:p_id', function(req, res, next) {
    // Before deleting, update 'e_deleted_by' of all entries tied to this forum for audit trail purpose.
    // Update 'e_deleted_by' of all entries tied to this forum only if the user is a managing professor of the course.
    var update_deleted_by =
    'UPDATE ForumEntries' 
    + ' SET e_deleted_by = $1'
    + ' WHERE TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $2'
    + ' AND c_code = $3'
    + ' AND c_year = $4'
    + ' AND c_sem = $5'
    + ' AND p_id = $6'
    + ' AND c_code IN'
    + ' ( SELECT m.c_code'
    + '   FROM Manages m'
    + '   WHERE m.p_id = $1'
    + '   AND m.c_year = $4'
    + '   AND m.c_sem = $5'
    + ' )';
    
    var delete_forum =
    'DELETE FROM Forums'
    + ' WHERE TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $1'
    + ' AND c_code = $2'
    + ' AND c_year = $3'
    + ' AND c_sem = $4'
    + ' AND p_id = $5';

    pool.query(update_deleted_by, [req.user.u_username, req.params.f_datetime, req.cid, req.year, req.sem, req.params.p_id], (err, result) => {
        if (err) {
            // Unable to update 'e_deleted_by' col of entries tied to this forum, do not proceed to delete.
            req.flash('delFail', 'Unable to delete forum. Please try again.');
            res.status(500).redirect('back');

        } else {
            // Successfully updated 'e_deleted_by' col of entries tied to the forum, proceed to delete.
            pool.query(delete_forum, [req.params.f_datetime, req.cid, req.year, req.sem, req.params.p_id], (err, data) => {
                if (err) {
                    req.flash('delFail', 'Unable to delete forum. Please try again.');
                    res.status(500).redirect('back');
                    
                } else {
                    req.flash('delSuccess', `Successfully deleted forum "${req.params.f_topic}".`);
                    res.status(200).redirect('back');
                }
            });
        }
    });
});

// Child routing for forum entries.
router.use('/:f_topic/:f_datetime/:p_id/entries', function(req, res, next) {
    req.f_topic = req.params.f_topic;
    req.f_datetime = req.params.f_datetime;
    req.p_id = req.params.p_id;
	next()
}, entries);

// Child routing for forum assign.
router.use('/assign', function(req, res, next) {
	next()
}, forumAssign);

// Child routing for forum unassign.
router.use('/unassign', function(req, res, next) {
	next()
}, forumUnassign);

// Child routing for forum unassign.
router.use('/participation', function(req, res, next) {
	next()
}, forumParticipation);


module.exports = router;