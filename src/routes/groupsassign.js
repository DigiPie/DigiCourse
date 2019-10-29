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

    if (req.user.u_type == "Student") {
        return res.render('error', {
            err_msg: "Page not found.",
            err_status: "Error: 404"
        });
    }
    
    var sql_query = `SELECT * FROM CourseEnrollments WHERE c_code =\'${req.params.cid}\' 
        AND req_type = 1
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}' 
        AND s_id NOT IN (
            SELECT s_id
            FROM StudentGroups
            WHERE c_code = \'${req.params.cid}\')`;

    var group_list_query =  
        `SELECT c.g_num
        FROM CourseGroups c
        JOIN (
            SELECT c.c_code, c.g_num, count(s.c_code) enrolled
            FROM CourseGroups c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_code = s.c_code
            AND c.g_num = s.g_num
            WHERE c.c_year = '${req.year}'
            AND c.c_sem = '${req.sem}' 
            GROUP BY c.c_code, c.g_num
            ORDER BY g_num) cs
        ON c.c_code = cs.c_code
        AND c.g_num = cs.g_num
        WHERE c.c_code = '${req.cid}'
        AND c.g_capacity <> cs.enrolled`;


	pool.query(sql_query, (err, data) => {
        pool.query(group_list_query, (gerr, gdata) => {
            res.render('groupsassign', {
                isCourse: req.isCourse, 
                username: req.user.u_name,
                accountType: req.user.u_type,
                uid: req.user.u_username, 
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
    
    var sids = [];
    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].selected;
        selected_rows[i].g_num = req.body.g_num;
        selected_rows[i].c_year = req.year;
        selected_rows[i].c_sem = req.sem;
        sids.push(selected_rows[i].s_id);
    }
    sids = sids.join(', ');

    const check_sql =
        `SELECT * FROM
        (SELECT g_capacity FROM CourseGroups
        WHERE c_code = '${req.cid}' 
        AND g_num = '${req.body.g_num}'
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}') cg,
        (SELECT count(*) enrolled FROM StudentGroups
        WHERE c_code = '${req.cid}' 
        AND g_num = '${req.body.g_num}'
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}') sg`

    const column_set = new pgp.helpers.ColumnSet(['c_code', 'c_year', 'c_sem', 's_id', 'g_num'], {table: 'studentgroups'});
    const insert_sql = pgp.helpers.insert(selected_rows, column_set);

    pool.query(check_sql, (err, cdata) => {
        if (err) {
            res.render('error', {
                err_msg: 'Something went wrong during insertion, try again later.',
                err_status: err.status || 500
            });
        } else {
            if ((parseInt(cdata.rows[0].enrolled) + parseInt(selected_rows.length)) > cdata.rows[0].g_capacity) {
                req.flash('error', 'Unable to add student(s) to the group as new group enrollment will exceed group capacity.');
                res.status(400).redirect('back');
                return;
            }
        } 
        pool.query(insert_sql, (err, data) => {
            if (err) {
                res.render('error', {
                    err_msg: 'Something went wrong during insertion, try again later.',
                    err_status: err.status || 500
                });
            } else {
                req.flash('success', `Successfully assigned ${sids} to group ${req.body.g_num}.`);
                res.status(200).redirect('back');
            }
        });
	});
    
});

module.exports = router;