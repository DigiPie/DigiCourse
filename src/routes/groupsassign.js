var express = require('express');
var router = express.Router({mergeParams: true});
const filter = require('lodash/filter');
const pgp = require('pg-promise') ({capSQL: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

router.get('/', function(req, res, next) {
     // Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
    }
    
    var sql_query = `SELECT * FROM CourseEnrollments WHERE c_id =\'${req.params.cid}\' 
        AND req_type = 1
        AND s_id NOT IN (
            SELECT s_id
            FROM StudentGroups
            WHERE c_id = \'${req.params.cid}\')`;

    var group_list_query =  
        `SELECT c.g_num
        FROM CourseGroups c
        JOIN (
            SELECT c.c_id, c.g_num, count(s.c_id) enrolled
            FROM CourseGroups c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_id = s.c_id
            AND c.g_num = s.g_num
            GROUP BY c.c_id, c.g_num
            ORDER BY g_num) cs
        ON c.c_id = cs.c_id
        AND c.g_num = cs.g_num
        WHERE c.c_id = '${req.cid}'
        AND c.g_capacity <> cs.enrolled`;


	pool.query(sql_query, (err, data) => {
        pool.query(group_list_query, (gerr, gdata) => {
            res.render('groupsassign', {
                isCourse: req.isCourse, 
                username: req.user.u_name,
                accountType: req.user.u_type,
                uid: req.user.u_id, 
                cid: req.cid,
                data: req.data,
                datarows: data.rows,
                groups: gdata.rows
            });
        });
    }); 
    
});

router.post('/', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'selected': 'on' });
    if (selected_rows.length == 0) {
        req.flash('error', `Please select a student`);
        res.status(400).redirect('back');
        return;
    }
    
    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].selected;
        selected_rows[i].g_num = req.body.g_num;
    }

    const column_set = new pgp.helpers.ColumnSet(['c_id', 's_id', 'g_num'], {table: 'studentgroups'});
    const insert_sql = pgp.helpers.insert(selected_rows, column_set);

    pool.query(insert_sql, (err, data) => {
        if (err) {
            res.status(err.status || 500);
            res.render('error', {
                message: "Something went wrong during insertion, try again later.",
                error: err
            });
        } else {
            res.status(200).redirect('back');
        }
	});
    
});

module.exports = router;