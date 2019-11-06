var express = require('express');
var router = express.Router({mergeParams: true});
const filter = require('lodash/filter');
const pgp = require('pg-promise') ({capSQL: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var current_capacity;
var increase_count;

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error',`Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
    }
    
    const capacity_query = `SELECT c_capacity FROM CourseYearSem WHERE c_code = '${req.params.cid}' AND c_year = '${req.year}' AND c_sem = '${req.sem}'`;

    var sql_query = `SELECT s_id, c_code, req_type, p_id, req_status, TO_CHAR(req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') req_datetime 
    FROM Enrollments 
    WHERE c_code ='${req.params.cid}'
    AND c_year = '${req.year}'
    AND c_sem = '${req.sem}'
    AND NOT req_status`;

    pool.query(capacity_query, (err, cdata) => {
        current_capacity = cdata.rows[0].c_capacity;
        increase_count = undefined;

        pool.query(sql_query, (err, data) => {
            res.render('enrollment', {
                isCourse: req.isCourse, 
                username: req.user.u_name,
                accountType: req.user.u_type,
                uid: req.user.u_username, 
                cid: req.cid,
                data: req.data,
                datarows: data.rows,
                capacity: current_capacity,
            });
        });  
    });
    
});

router.post('/increase', function(req, res, next) {
    if (req.body.c_capacity == '' || isNaN(req.body.c_capacity) || req.body.c_capacity <= 0) {
        req.flash('error', `Please enter a valid capacity.`);
        res.status(400).redirect('back');
        return;
    }

    const check_capacity_sql = `SELECT COUNT(*) count FROM CourseEnrollments
    WHERE c_code = '${req.params.cid}'
    AND c_year = '${req.year}' 
    AND c_sem = '${req.sem}'
    AND req_type = 1`

    const column_set = new pgp.helpers.ColumnSet(['?c_code', 'c_capacity'], {table: 'courseyearsem'});
    const update_sql = pgp.helpers.update({c_code: req.params.cid, c_capacity: req.body.c_capacity}, column_set) 
    + ` WHERE c_code = '${req.params.cid}' AND c_year = '${req.year}' AND c_sem = '${req.sem}'`;

    pool.query(check_capacity_sql, (err, cdata) => {
        if (parseInt(req.body.c_capacity) < parseInt(cdata.rows[0].count)) {
            req.flash('error', `Please enter a valid capacity. Capacity must be at least equal to number of students already enrolled in the course: ${cdata.rows[0].count}.`);
            res.status(400).redirect('back');
            return;
        }
        pool.query(update_sql, (err, data) => {
            if (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: 'Something went wrong during the update, try again later.',
                    error: err
                });
            } else {
                req.flash('success', `Successfully changed the course capacity to ${req.body.c_capacity}.`);
                res.status(200).redirect('back');
            }
        });
    });
});

// POST
router.post('/accept', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'accepted': 'on' });
    if (selected_rows.length == 0) {
        req.flash('error', `Please select a student`);
        res.status(400).redirect('back');
        return;
    }

    var sids = [];
    var ta_rows = [];
    var t_sid = [];
    var s_sid = [];
    
    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].accepted;
        selected_rows[i].req_status = true;
        selected_rows[i].p_id = req.user.u_username;
        sids.push(selected_rows[i].s_id);

        if (selected_rows[i].req_type == 0) {
            ta_rows.push(selected_rows[i]);
            t_sid.push(selected_rows[i].s_id);
        } else {
            s_sid.push(selected_rows[i].s_id);
        }
    }
    
    const scount = s_sid.length;

    sids = sids.join(', ');
    t_sid = t_sid.join(', ');
    s_sid = s_sid.join(', ');

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_code', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const where_sql = ` WHERE v.s_id = t.s_id AND v.c_code = t.c_code AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime AND t.c_year = '${req.year}'
    AND t.c_sem = '${req.sem}'`;
    var check_query = `SELECT c_capacity - (
            SELECT COUNT(*) scount
            FROM CourseEnrollments
            WHERE c_code = '${req.params.cid}'
            AND c_year = '${req.year}'
            AND c_sem = '${req.sem}'
            AND req_type = 1) available
        FROM CourseYearSem
        WHERE c_code = '${req.params.cid}'
        AND c_year = '${req.year}'
        AND c_sem = '${req.sem}'`;

        console.log(check_query);

	pool.query(check_query, (err, data) => {
        if (data.rows[0].available < scount) {
            increase_count = scount - data.rows[0].available + current_capacity;
            if (ta_rows.length != 0) {
                const update_sql = pgp.helpers.update(ta_rows, column_set) + where_sql;
                pool.query(update_sql, (err, data) => {
                    if (err) {
                        res.render('error', {
                            err_msg: "Something went wrong during the update, try again later.",
                            err_status: err.status || 500
                        });
                    } else {
                        req.flash('success', `Successfully enrolled ${t_sid} as Teaching Assistant.\n `);

                        if (s_sid.length != '') {
                            req.flash('error', `Course capacity have reached, please increase the capacity to ${increase_count} to enroll ${s_sid}.`);
                        }

                        res.status(200).redirect('back');
                        return;
                    }
                });

            } else {
                req.flash('error', `Course capacity have reached, please increase the capacity to ${increase_count} to enroll ${s_sid}.`);
                res.status(400).redirect('back');
                return;
            }
        } else {
            const update_sql = pgp.helpers.update(selected_rows, column_set) + where_sql;
    
            pool.query(update_sql, (err, data) => {
                if (err) {
                    res.render('error', {
                        err_msg: "Something went wrong during the update, try again later.",
                        err_status: err.status || 500
                    });
                } else {
                    req.flash('success', `Successfully enrolled ${sids}.`);
                    res.status(200).redirect('back');
                }
            });
        }
    });
});

// POST
router.post('/reject', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'accepted': 'on' });
    if (selected_rows.length == 0) {
        req.flash('error', `Please select a student`);
        res.status(400).redirect('back');
        return;
    }
    
    var sids = [];

    for(var i=0; i<selected_rows.length; i++) {
        delete selected_rows[i].accepted;
        selected_rows[i].req_status = false;
        selected_rows[i].p_id = req.user.u_username;
        sids.push(selected_rows[i].s_id);
    }

    sids = sids.join(', ');

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_code', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const update_sql = pgp.helpers.update(selected_rows, column_set) 
    + ' WHERE v.s_id = t.s_id AND v.c_code = t.c_code AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime';
    	
	pool.query(update_sql, (err, data) => {
        if (err) {
            res.render('error', {
                err_msg: "Something went wrong during the update, try again later.",
                err_status: err.status || 500
            });
        } else {
            req.flash('success', `Successfully rejected ${sids}.`);
            res.status(200).redirect('back');
        }
	});
});

module.exports = router;