var express = require('express');
var router = express.Router({mergeParams: true});
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
    
    var sql_query =  
        `SELECT c1.*, cs.enrolled
        FROM CourseGroups c1
        JOIN (
            SELECT c.c_code, c.c_year, c.c_sem, c.g_num, count(s.c_code) enrolled
            FROM CourseGroups c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_code = s.c_code
            AND c.g_num = s.g_num
            AND c.c_year = s.c_year
            AND c.c_sem = s.c_sem
            WHERE c.c_year = '${req.year}'
            AND c.c_sem = '${req.sem}'
            GROUP BY c.c_code, c.g_num, c.c_year, c.c_sem) cs
        ON c1.c_code = cs.c_code
        AND c1.g_num = cs.g_num
        AND c1.c_year = cs.c_year
        AND c1.c_sem = cs.c_sem
        WHERE c1.c_code = '${req.cid}'
        ORDER BY c1.g_num`;

    
    
	pool.query(sql_query, (err, data) => {
        res.render('groupCreate', {
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
    if (req.body.g_num == '' || isNaN(req.body.g_num) || req.body.g_num <= 0) {
        req.flash('error', 'Please enter a valid group number.');
        res.redirect('back');
        return;
    }

    if (req.body.g_capacity == '' || isNaN(req.body.g_capacity) || req.body.g_capacity <= 0) {
        req.flash('error', 'Please enter a valid gorup capacity. Minimum group capacity is 1.');
        res.redirect('back');
        return;
    }

    var sql_query = `INSERT INTO CourseGroups VAlUES ('${req.user.u_username}', '${req.body.c_code}', '${req.year}', '${req.sem}', '${req.body.g_num}', '${req.body.g_capacity}')`;

	pool.query(sql_query, (err, data) => {
        if (err) {
            if (err.code == 23505) {
                req.flash('error', `Unable to create a group with this group number ${req.body.g_num}. This number is already in use by an existing group.`);
                res.redirect('back');
            } else {
                res.render('error', {
                    err_msg: "Something went wrong during insertion, try again later.",
                    err_status: err.status || 500
                });
            }
        } else {
            req.flash('success', `Successfully created group ${req.body.g_num} with capacity of ${req.body.g_capacity}.`);
            res.status(200).redirect('back');
        }
    });
    
});

module.exports = router;