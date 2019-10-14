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
		req.flash('error','Login is required');
		return res.redirect('/login');
    }

    var sql_query = 
    `SELECT g_num, TO_CHAR(f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') f_datetime
    FROM CourseGroups cg, Forums f
    WHERE cg.c_id = f.c_id 
    AND f.c_id =\'${req.cid}\'
    EXCEPT
    SELECT fg.g_num, TO_CHAR(fg.f_datetime, 'Dy Mon DD YYYY HH24:MI:SS') fdt
    FROM ForumsGroups fg
    ORDER BY g_num
    `;
    
	pool.query(sql_query, (err, result) => {
		res.render('forumsassign', {
			isCourse: req.isCourse,
			username: req.username,
			accountType: req.user.u_type, 
			cid: req.cid,
            data: req.data,
            forums: req.forums_list,
            forumGroups: result.rows
		});
    });
});

router.post('/', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'selected': 'on' });
    if (selected_rows.length == 0) {
        req.flash('error', `Please select a group`);
        res.status(400).redirect('back');
        return;
    }
    
    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].selected;
        selected_rows[i].c_id = req.cid;
    }

    const column_set = new pgp.helpers.ColumnSet(['f_datetime', 'g_num', 'c_id'], {table: 'forumsgroups'});
    const insert_sql = pgp.helpers.insert(selected_rows, column_set);

    pool.query(insert_sql, (err, data) => {
        if (err) {
            req.flash('error', `Error. Please try again.`);
            res.status(err.status || 500).redirect('back');
        } else {
            req.flash('success', 'Successfully assigned forum(s) to group(s).');
            res.status(200).redirect('back');
        }
	});
});

module.exports = router;