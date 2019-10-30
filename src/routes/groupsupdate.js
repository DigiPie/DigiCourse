let express = require('express');
let router = express.Router({mergeParams: true});
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
    
    const sql_query =  
        `SELECT c.*, cs.enrolled
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
        WHERE c.c_code = '${req.cid}'`;

    const group_list_query =  
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
    WHERE c.c_code = '${req.cid}'`;

	pool.query(sql_query, (err, data) => {
        pool.query(group_list_query, (gerr, gdata) => {
            res.render('groupsupdate', {
                isCourse: req.isCourse,
                username: req.user.u_name,
                accountType: req.user.u_type,
                uid: req.user.u_username, 
                cid: req.cid,
                data: req.data,
                datarows: data.rows,
                groups: gdata.rows || []
            });
        });
    });
    
});

router.post('/', function(req, res, next) {
    if (req.body.g_capacity == '' || isNaN(req.body.g_capacity) || req.body.g_capacity <= 0) {
        req.flash('error', 'Please enter a valid group capacity. Minimum group capacity is 1.');
        res.redirect('back');
        return;
    }

    const check_capacity_sql = `SELECT COUNT(*) count FROM StudentGroups
    WHERE c_code = '${req.params.cid}'
    AND c_year = '${req.year}' 
    AND c_sem = '${req.sem}'
    AND g_num = '${req.body.g_num}'`;

    pool.query(check_capacity_sql, (err, cdata) => {
        if (parseInt(req.body.g_capacity) < parseInt(cdata.rows[0].count)) {
            req.flash('error', `Please enter a valid capacity. Capacity must be at least equal to number of students already assigned to the group: ${cdata.rows[0].count}.`);
            res.status(400).redirect('back');
            return;
        }

        let update_sql = `UPDATE CourseGroups SET g_capacity = '${req.body.g_capacity}' WHERE g_num = '${req.body.g_num}'`;

        pool.query(update_sql, (err, data) => {
            if (err) {
                res.render('error', {
                    err_msg: 'Something went wrong during update, try again later.',
                    err_status: err.status || 500
                });
            } else {
                req.flash('success', `Successfully changed group ${req.body.g_num}'s capacity to ${req.body.g_capacity}.`);
                res.status(200).redirect('back');
            }
        });
    });
});

module.exports = router;