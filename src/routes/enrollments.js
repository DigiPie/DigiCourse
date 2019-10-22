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
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
    }
    
    const capacity_query = `SELECT c_capacity FROM CourseYearSem WHERE c_id = '${req.params.cid}' AND c_year = '${req.year}' AND c_sem = '${req.sem}'`;

    var sql_query = `SELECT s_id, c_id, req_type, p_id, req_status, TO_CHAR(req_datetime, 'Dy Mon DD YYYY HH24:MI:SS') req_datetime 
    FROM Enrollments 
    WHERE c_id ='${req.params.cid}'
    AND c_year = '${req.year}'
    AND c_sem = '${req.sem}'
    AND NOT req_status`;

    pool.query(capacity_query, (err, cdata) => {
        current_capacity = cdata.rows[0].c_capacity;
        var new_capacity = increase_count == undefined ? current_capacity + 10 : increase_count; 
        increase_count = undefined;

        pool.query(sql_query, (err, data) => {
            res.render('enrollments', {
                isCourse: req.isCourse, 
                username: req.user.u_name,
                accountType: req.user.u_type,
                uid: req.user.u_id, 
                cid: req.cid,
                data: req.data,
                datarows: data.rows,
                capacity: current_capacity,
                new_capacity: new_capacity 
            });
        });  
    });
    
});

const account_uid = 'P0000001A';

router.post('/increase', function(req, res, next) {
    if (req.body.c_capacity.length == 0) {
        req.flash('error', `Please enter a capacity`);
        res.status(400).redirect('back');
        return;
    }

    const column_set = new pgp.helpers.ColumnSet(['?c_id', 'c_capacity'], {table: 'courseyearsem'});
    const update_sql = pgp.helpers.update({c_id: req.params.cid, c_capacity: req.body.c_capacity}, column_set) 
    + ` WHERE c_id = '${req.params.cid}' AND c_year = '${req.year}' AND c_sem = '${req.sem}'`;

	pool.query(update_sql, (err, data) => {
        if (err) {
            res.status(err.status || 500);
            res.render('error', {
                message: "Something went wrong during the update, try again later.",
                error: err
            });
        } else {
            req.flash('success', `Successfully increased the capacity to ${req.body.c_capacity}.`);
            res.status(200).redirect('back');
        }
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
        selected_rows[i].p_id = account_uid;
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

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_id', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const where_sql = ` WHERE v.s_id = t.s_id AND v.c_id = t.c_id AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime AND t.c_year = '${req.year}'
    AND t.c_sem = '${req.sem}'`;
    var check_query = `SELECT c_capacity - (
            SELECT COUNT(*) scount
            FROM CourseEnrollments
            WHERE c_id = '${req.params.cid}'
            AND c_year = '${req.year}'
            AND c_sem = '${req.sem}'
            AND req_type = 1) available
        FROM CourseYearSem
        WHERE c_id = '${req.params.cid}'
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
        selected_rows[i].p_id = account_uid;
        sids.push(selected_rows[i].s_id);
    }

    sids = sids.join(', ');

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_id', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const update_sql = pgp.helpers.update(selected_rows, column_set) 
    + ' WHERE v.s_id = t.s_id AND v.c_id = t.c_id AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime';
    	
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