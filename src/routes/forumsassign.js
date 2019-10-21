var express = require('express');
var router = express.Router({mergeParams: true})

const filter = require('lodash/filter');
const pgp = require('pg-promise') ({capSQL: true});
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

    // Retrieves a list of forums that can still be assigned to groups (hasn't been fully assigned to all groups).
    var get_forums_for_assign =
    'SELECT afg.f_topic, TO_CHAR(afg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM' 
	+ ' ( SELECT COUNT(g_num) c, f.f_datetime, f.f_topic'
    + '   FROM ForumsGroups fg RIGHT JOIN Forums f'
    + '   ON fg.c_id = f.c_id'
    + '   AND fg.f_datetime = f.f_datetime'
	+ '   WHERE f.c_id = $1'
    + '   GROUP BY f.f_datetime, f.f_topic'
    + ' ) afg'
    + ' WHERE afg.c <'
	+ ' ( SELECT COUNT(*)'
	+ '   FROM CourseGroups'
    + '   WHERE c_id = $1'
    + ' )'
    + ' ORDER BY afg.f_datetime'; 

    // For each forum, retrieve a list of group numbers that haven't been assigned to the forum.
    var get_groups_for_assign = 
    'SELECT g_num, TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM CourseGroups cg, Forums f'
    + ' WHERE cg.c_id = f.c_id'
    + ' AND f.c_id = $1'
    + ' EXCEPT'
    + ' SELECT fg.g_num, TO_CHAR(fg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') fdt'
    + ' FROM ForumsGroups fg'
    + ' ORDER BY g_num';
    
	pool.query(get_forums_for_assign, [req.cid], (err, forums) => {
        pool.query(get_groups_for_assign, [req.cid], (err, result) => {
            res.render('forumsAssign', {
                isCourse: req.isCourse,
                username: req.user.u_name,
                accountType: req.user.u_type, 
                cid: req.cid,
                data: req.data,
                forums: forums.rows,
                forumGroups: result.rows
            });
        });
    });
});

router.post('/', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'selected': 'on' });

    // No group selected for assign is not allowed. 
    if (selected_rows.length == 0) {
        req.flash('error', 'Please select a group.');
        res.status(400).redirect('back');
        return;
    }
    
    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].selected;
        selected_rows[i].c_id = req.cid;
    }

    const column_set = new pgp.helpers.ColumnSet(['f_datetime', 'g_num', 'c_id'], {table: 'forumsgroups'});
    const assign_forums_to_groups = pgp.helpers.insert(selected_rows, column_set);

    pool.query(assign_forums_to_groups, (err, data) => {
        if (err || data.rowCount == 0) {
            req.flash('error', 'Error. Please try again.');
            res.status(500).redirect('back');
        } else {
            req.flash('success', 'Successfully assigned forum(s) to group(s).');
            res.status(200).redirect('back');
        }
	});
});

module.exports = router;