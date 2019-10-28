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
		req.flash('error','Login is required.');
        return res.redirect('/login');
    }
    
    // Checks whether the user is an approved TA of the course or a professor managing the course (to allow deletion of forum entries).
    var check_forum_privilege = 
    'SELECT u_username, CASE'
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Enrollments' 
    + '   WHERE s_id = $1' 
    + '   AND c_code = $2' 
    + '   AND c_year = $3'
    + '   AND c_sem = $4'
    + '   AND req_type = 0' 
    + '   AND req_status = \'TRUE\''
    + ' ) = 1 THEN \'Teaching\''
    + ' WHEN' 
    + ' ( SELECT COUNT(*)' 
    + '   FROM Manages' 
    + '   WHERE p_id = $1'
    + '   AND c_code = $2'
    + '   AND c_year = $3'
    + '   AND c_sem = $4'
    + ' ) = 1 THEN \'Professor\''
	+ ' ELSE \'null\''
	+ ' END AS u_type'
	+ ' FROM Accounts'
    + ' WHERE u_username = $1';
	
    var show_entries = 
    'SELECT fe.u_username, u_name, TO_CHAR(e_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted, e_content'
    + ' FROM ForumEntries fe JOIN Accounts a'
    + ' ON fe.u_username = a.u_username'
    + ' WHERE c_code = $1'
    + ' AND c_year = $3'
    + ' AND c_sem = $4'
    + ' AND p_id = $5'
    + ' AND TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $2'
    + ' ORDER BY e_datetime';

	pool.query(check_forum_privilege, [req.user.u_username, req.cid, req.year, req.sem], (err, result) => {
        var f_delete_privilege = false; // Students (non-teaching assistant) cannot delete any forum entries.

        if (result.rows.length == 1) {
            if (result.rows[0].u_type == 'Teaching' || result.rows[0].u_type == 'Professor') {
                f_delete_privilege = true;
            }
        }

        pool.query(show_entries, [req.cid, req.f_datetime, req.year, req.sem, req.p_id], (err, entries) => {
            res.render('entries', {
                isCourse: req.isCourse,
                username: req.user.u_name,
                accountType: req.user.u_type, 
                cid: req.cid,
                data: req.data,
                f_topic: req.f_topic,
                f_datetime: req.f_datetime,
                p_id : req.p_id,
                f_delete_privilege: f_delete_privilege,
                entries: entries.rows
            });
        });
	});
});

router.post('/post', function(req, res, next) {
    // Blank forum entry is not allowed.
    if (req.body.e_content == '') {
        req.flash('error', 'Please enter content for the new forum entry.');
        res.redirect(`/course/${req.cid}/forum/${req.f_topic}/${req.f_datetime}/${req.p_id}/entries`);
        return;
    }

    // Content exceeding character limit of 1000 is not allowed.
    if (req.body.e_content.length > 1000) {
        req.flash('error', 'Error. Character limit exceeded.');
        res.status(500).redirect('back');
    
    } else {
        var insert_new_entry = `INSERT INTO ForumEntries VAlUES ('${req.cid}', '${req.year}', '${req.sem}', '${req.p_id}', '${req.f_datetime}', '${req.user.u_username}', NOW(), '${req.body.e_content}')`;

        pool.query(insert_new_entry, (err, data) => {
            if (err) {
                req.flash('error', 'Error. Please try again.');
                res.status(500).redirect('back');

            } else {
                req.flash('success', 'Successfully posted new entry.');
                res.status(200).redirect('back');
            }
        });
    }
});

router.post('/delete/:e_author/:e_datetime', function(req, res, next) {
    
    // Before deleting, update 'e_deleted_by' col of the entry for audit trail purpose.
    // Update 'e_deleted_by' col of the entry only if the user is a managing professor or teaching assistant of the course.
    var update_deleted_by =
    'UPDATE ForumEntries' 
    + ' SET e_deleted_by = $1'
    + ' WHERE TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $2'
    + ' AND u_username = $3'
    + ' AND TO_CHAR(e_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $4'
    + ' AND c_code = $5'
    + ' AND c_year = $6'
    + ' AND c_sem = $7'
    + ' AND p_id = $8'
    + ' AND'
    + ' ( c_code IN'
    + '   ( SELECT m.c_code'
    + '     FROM Manages m'
    + '     WHERE p_id = $1'
    + '     AND c_year = $6'
    + '     AND c_sem = $7'
    + '   )'
    + ' OR c_code IN'
    + '    ( SELECT e.c_code'
    + '      FROM Enrollments e'
    + '      WHERE s_id = $1'
    + '      AND c_year = $6'
    + '      AND c_sem = $7'
    + '      AND req_type = 0'
    + '      AND req_status = \'TRUE\''
    + '    )'
    + ' )';

    var delete_entry =
    'DELETE FROM ForumEntries'
    + ' WHERE TO_CHAR(e_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $1'
    + ' AND u_username = $2'
    + ' AND c_code = $3'
    + ' AND c_year = $5'
    + ' AND c_sem = $6'
    + ' AND p_id = $7'
    + ' AND TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = $4';

    pool.query(update_deleted_by, [req.user.u_username, req.f_datetime, req.params.e_author, req.params.e_datetime, req.cid, req.year, req.sem, req.p_id], (err, result) => {

        if (err || result.rowCount == 0) {
            req.flash('delFail', 'Unable to delete entry. Please try again.');
            res.status(500).redirect('back');
        
        } else {
            pool.query(delete_entry, [req.params.e_datetime, req.params.e_author, req.cid, req.f_datetime, req.year, req.sem, req.p_id], (err, data) => {
                if (err || data.rowCount == 0) {
                    req.flash('delFail', 'Unable to delete entry. Please try again.');
                    res.status(500).redirect('back');

                } else {
                    req.flash('delSuccess', `Successfully deleted entry posted on ${req.params.e_datetime} by ${req.params.e_author}.`);
                    res.status(200).redirect('back');
                }
            });
        }
    });
});

module.exports = router;