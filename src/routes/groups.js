let express = require('express');
let router = express.Router({mergeParams: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

const groupscreate = require('./groupscreate');
const groupsassign = require('./groupsassign');
const groupsupdate = require('./groupsupdate');
const groupsunassign = require('./groupsunassign');

let courseName;

router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
    }
    
    courseName = req.data;

    let sql_query = `SELECT c.s_id, c.u_name, s.g_num, c.req_type
            FROM CourseEnrollments c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_code = s.c_code
            AND c.s_id = s.s_id
            WHERE c.c_code = \'${req.params.cid}\'
            AND c.c_year = '${req.year}'
            AND c.c_sem = '${req.sem}'
            ORDER BY c.req_type, c.s_id`;

	pool.query(sql_query, (err, data) => {
        res.render('groups', {
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

router.use('/create', function(req, res, next) {
	next()
}, groupscreate);

router.use('/assign', function(req, res, next) {
	next()
}, groupsassign);

router.use('/update', function(req, res, next) {
	next()
}, groupsupdate);

router.use('/unassign', function(req, res, next) {
	next()
}, groupsunassign);

module.exports = router;