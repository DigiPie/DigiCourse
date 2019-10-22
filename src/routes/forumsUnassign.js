var express = require('express');
var router = express.Router({mergeParams: true})

const filter = require('lodash/filter');
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

    // Retrieves a list of forums that has been assigned to groups (assigned to at least 1 group).
    var get_forums_for_unassign =
    'SELECT distinct f.f_topic, TO_CHAR(fg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM ForumsGroups fg JOIN Forums f'
    + ' ON fg.c_id = f.c_id'
    + ' AND fg.c_year = f.c_year'
    + ' AND fg.c_sem = f.c_sem'
    + ' AND fg.f_datetime = f.f_datetime'
    + ' WHERE fg.c_id = $1'
    + ' AND fg.c_year = $2'
    + ' AND fg.c_sem = $3'; 

    // For each forum, retrieve a list of group numbers that are assigned to the forum.
    var get_groups_for_unassign = 
    ' SELECT fg.g_num, TO_CHAR(fg.f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') formatted'
    + ' FROM ForumsGroups fg'
    + ' WHERE fg.c_id = $1'
    + ' AND fg.c_year = $2'
    + ' AND fg.c_sem = $3' 
    + ' ORDER BY g_num';
    
	pool.query(get_forums_for_unassign, [req.cid, req.year, req.sem], (err, forums) => {
        pool.query(get_groups_for_unassign, [req.cid, req.year, req.sem], (err, result) => {
            res.render('forumsUnassign', {
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
    
    // No group selected for unassign is not allowed. 
    if (selected_rows.length == 0) {
        req.flash('error', 'Please select a group.');
        res.status(400).redirect('back');
        return;
    }
    
    var unassign_groups_from_forums = '';

    for(var i = 0; i < selected_rows.length; i++) {
        unassign_groups_from_forums += 
        `DELETE FROM ForumsGroups
        WHERE c_id = '${req.cid}'
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}'
        AND TO_CHAR(f_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = '${selected_rows[i].f_datetime}'
        AND g_num = '${selected_rows[i].g_num}'; `;
    }

    pool.query(unassign_groups_from_forums, (err, data) => {
        if (err || data.rowCount == 0) {
            req.flash('error', 'Error. Please try again.');
            res.status(500).redirect('back');
            
        } else {
            req.flash('success', 'Successfully unassigned groups(s) from forums(s).');
            res.status(200).redirect('back');
        }
	});
});

module.exports = router;