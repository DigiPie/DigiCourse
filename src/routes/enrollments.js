var express = require('express');
var router = express.Router({mergeParams: true});
const filter = require('lodash/filter');
const pgp = require('pg-promise') ({capSQL: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});


/**** Routing ****/
router.get('/', function(req, res, next) {
    var sql_query = `SELECT * FROM Enrollments WHERE c_id =\'${req.params.cid}\' AND NOT req_status`;

	pool.query(sql_query, (err, data) => {
        res.render('enrollments', {
            isCourse: req.isCourse, 
            username: req.username,
            accountType: req.accountType, 
            cid: req.cid,
            data: req.data,
            datarows: data.rows
        });
    });
    
});

const account_uid = 'P0000001A';

// POST
router.post('/accept', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'accepted': 'on' });

    for(var i = 0; i < selected_rows.length; i++) {
        delete selected_rows[i].accepted;
        selected_rows[i].req_status = true;
        selected_rows[i].p_id = account_uid;
        var removedTimezone = selected_rows[i].req_datetime;
        selected_rows[i].req_datetime = removedTimezone.replace(" GMT+0800 (Singapore Standard Time)", "");
    }

    if (selected_rows.length == 0) {
        res.status(200).redirect('back');
    }

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_id', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const update_sql = pgp.helpers.update(selected_rows, column_set) 
    + ' WHERE v.s_id = t.s_id AND v.c_id = t.c_id AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime';
    
	pool.query(update_sql, (err, data) => {
        if (err) {
            res.status(err.status || 500);
            res.render('error', {
                message: "Something went wrong during the update, try again later.",
                error: err
            });
        } else {
            res.status(200).redirect('back');
        }
	});
});

// POST
router.post('/reject', function(req, res, next) {
    const selected_rows = filter(req.body.row, { 'accepted': 'on' });

    for(var i=0; i<selected_rows.length; i++) {
        delete selected_rows[i].accepted;
        selected_rows[i].req_status = false;
        selected_rows[i].p_id = account_uid;
    }

    if (selected_rows.length == 0) {
        res.status(200).redirect('back');
    }

    const column_set = new pgp.helpers.ColumnSet(['?s_id','?c_id', '?req_type', '?req_datetime', 'req_status', 'p_id'], {table: 'enrollments'});
    const update_sql = pgp.helpers.update(selected_rows, column_set) 
    + ' WHERE v.s_id = t.s_id AND v.c_id = t.c_id AND TO_CHAR(t.req_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') = v.req_datetime';
    	
	pool.query(update_sql, (err, data) => {
        if (err) {
            res.status(err.status || 500);
            res.render('error', {
                message: "Something went wrong during the update, try again later.",
                error: err
            });
        } else {
            res.status(200).redirect('back');
        }
	});
});

module.exports = router;