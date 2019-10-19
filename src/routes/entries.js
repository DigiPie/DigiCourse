var express = require('express');
var router = express.Router({mergeParams: true})

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
    
    // Checks whether the user is an approved TA of the course or a professor managing the course (to allow deletion of forum entries).
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
	
    var show_entries = 
    'SELECT fe.u_id, u_name, TO_CHAR(e_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted, e_content'
    + ' FROM ForumEntries fe JOIN Accounts a'
    + ' ON fe.u_id = a.u_id'
    + ' WHERE c_id = $1' 
    + ' AND f_datetime = $2'
    + ' ORDER BY e_datetime';

	pool.query(check_forum_privilege, [req.user.u_id, req.cid], (err, result) => {
        var f_delete_privilege = false; // Students (non-teaching assistant) cannot delete any forum entries.

        if (result.rows.length == 1) {
            if (result.rows[0].u_type == 'Teaching' || result.rows[0].u_type == 'Professor') {
                f_delete_privilege = true;
            }
        }

        pool.query(show_entries, [req.cid, req.f_datetime], (err, entries) => {
            res.render('entries', {
                isCourse: req.isCourse,
                username: req.user.u_name,
                accountType: req.user.u_type, 
                cid: req.cid,
                data: req.data,
                f_topic: req.f_topic,
                f_datetime: req.f_datetime,
                f_delete_privilege: f_delete_privilege,
                entries: entries.rows
            });
        });
	});
});

router.post('/post', function(req, res, next) {
    // Blank forum entry is not allowed.
    if (req.body.e_content == '') {
        req.flash('error', 'Please enter content for the new forum entry');
        res.redirect(`/course/${req.cid}/forum/${req.f_topic}/${req.f_datetime}/entries`);
        return;
    }

    // Content exceeding character limit of 1000 is not allowed.
    if (req.body.e_content.length > 1000) {
        req.flash('error', 'Error. Character limit exceeded');
        res.status(500).redirect('back');
    
    } else {
        var insert_new_entry = `INSERT INTO ForumEntries VAlUES ('${req.cid}', '${req.f_datetime}', '${req.user.u_id}', to_timestamp(${Date.now()} / 1000), '${req.body.e_content}')`;

        pool.query(insert_new_entry, (err, data) => {
            if (err) {
                req.flash('error', 'Error. Please try again.');
                res.status(err.status || 500).redirect('back');
            } else {
                req.flash('success', 'Successfully posted new entry');
                res.status(200).redirect('back');
            }
        });
    }
});

router.post('/delete/:e_author/:e_datetime', function(req, res, next) {
    
    // Delete an entry from a course forum only if the user is a managing professor or an approved TA of the course.
    var delete_entry =
    'DELETE FROM ForumEntries'
    + ' WHERE e_datetime = $1'
    + ' AND u_id = $2'
    + ' AND c_id = $3'
    + ' AND' 
    + ' ( c_id IN'
    + '   ( SELECT m.c_id'
    + '     FROM Manages m'
    + '     WHERE p_id = $4'
    + '   )'
    + ' OR c_id IN'
    + '    ( SELECT e.c_id'
    + '      FROM Enrollments e'
    + '      WHERE s_id = $4'
    + '      AND req_type = 0'
    + '      AND req_status = \'TRUE\''
    + '    )'
    + ' )';

    pool.query(delete_entry, [req.params.e_datetime, req.params.e_author, req.cid, req.user.u_id], (err, data) => {
        if (err) {
            req.flash('delFail', 'Unable to delete entry. Please try again.');
            res.status(err.status || 500).redirect('back');
        } else {
            req.flash('delSuccess', `Successfully deleted entry posted by ${req.params.e_author} on ${req.params.e_datetime}`);
            res.status(200).redirect('back');
        }
    });
});

module.exports = router;