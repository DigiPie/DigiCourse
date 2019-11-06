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
    'SELECT afg.f_topic, afg.p_id, TO_CHAR(afg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM' 
	+ ' ( SELECT COUNT(g_num) c, f.p_id, f.f_datetime, f.f_topic'
    + '   FROM ForumsGroups fg RIGHT JOIN Forums f'
    + '   ON fg.c_code = f.c_code'
    + '   AND fg.c_year = f.c_year'
    + '   AND fg.c_sem = f.c_sem'
    + '   AND fg.p_id = f.p_id'
    + '   AND fg.f_datetime = f.f_datetime'
    + '   WHERE f.c_code = $1'
    + '   AND f.c_year = $2'
    + '   AND f.c_sem = $3'
    + '   GROUP BY f.f_datetime, f.p_id, f.f_topic'
    + '   HAVING COUNT(g_num) <'
    + '       ( SELECT COUNT(*)'
	+ '         FROM CourseGroups'
    + '         WHERE c_code = $1'
    + '         AND c_year = $2'
    + '         AND c_sem = $3'
    + '       )'
    + ' ) afg'
    + ' ORDER BY afg.f_datetime'; 

    // For each forum, retrieve a list of group numbers that haven't been assigned to the forum.
    var get_groups_for_assign = 
    'SELECT g_num, p_id, TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM CourseGroups cg, Forums f'
    + ' WHERE cg.c_code = f.c_code'
    + ' AND cg.c_year = f.c_year'
    + ' AND cg.c_sem = f.c_sem'
    + ' AND f.c_code = $1'
    + ' AND f.c_year = $2'
    + ' AND f.c_sem = $3'
    + ' EXCEPT'
    + ' SELECT fg.g_num, fg.p_id, TO_CHAR(fg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') fdt'
    + ' FROM ForumsGroups fg'
    + ' WHERE fg.c_code = $1'
    + ' AND fg.c_year = $2'
    + ' AND fg.c_sem = $3'
    + ' ORDER BY g_num';
    
	pool.query(get_forums_for_assign, [req.cid, req.year, req.sem], (err, forums) => {
        pool.query(get_groups_for_assign, [req.cid, req.year, req.sem], (err, result) => {
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
        selected_rows[i].c_code = req.cid;
        selected_rows[i].c_year = req.year;
        selected_rows[i].c_sem = req.sem;
    }

    const column_set = new pgp.helpers.ColumnSet(['p_id', 'f_datetime', 'g_num', 'c_code', 'c_year', 'c_sem'], {table: 'forumsgroups'});
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