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
		req.flash('error',`Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
    }

    if (req.user.u_type == "Student") {
        return res.render('error', {
            err_msg: "Page not found.",
            err_status: "Error: 404"
        });
    }
    
    var sql_query = `SELECT c.s_id, c.u_name, s.g_num
            FROM CourseEnrollments c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_code = s.c_code
            AND c.s_id = s.s_id
            WHERE c.c_code = \'${req.params.cid}\'
            AND c.c_year = '${req.year}'
            AND c.c_sem = '${req.sem}'
            AND s.g_num IS NOT NULL
            ORDER BY c.req_type, c.s_id`;


    pool.query(sql_query, (gerr, data) => {
        res.render('groupsunassign', {
            isCourse: req.isCourse, 
            username: req.user.u_name,
            accountType: req.user.u_type,
            uid: req.user.u_username, 
            cid: req.cid,
            data: req.data,
            datarows: data.rows
        });
    });
    
});

router.post('/', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'selected': 'on' });
    if (selected_rows.length == 0) {
        req.flash('error', `Please select a student.`);
        res.status(400).redirect('back');
        return;
    }

    var delete_query = [];
    var sids = [];
    
    for (var i = 0; i < selected_rows.length; i++) {
        sids.push(selected_rows[i].s_id);
        delete_query.push(`DELETE FROM StudentGroups WHERE c_code = '${selected_rows[i].c_code}' 
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}' 
        AND g_num = '${selected_rows[i].g_num}' 
        AND s_id = '${selected_rows[i].s_id}'; `);
    }
    sids = sids.join(', ');
    delete_query = delete_query.join('; ');

    pool.query(delete_query, (err, data) => {
        if (err) {
            res.render('error', {
                err_msg: "Something went wrong during deletion, try again later.",
                err_status: err.status || 500
            });
        } else {
            req.flash('success', `Successfully unassigned ${sids}.`);
            res.status(200).redirect('back');
        }
	});
    
});

module.exports = router;