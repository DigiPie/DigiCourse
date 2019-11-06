let express = require('express');
let router = express.Router({mergeParams: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

const groupCreate = require('./groupCreate');
const groupAssign = require('./groupAssign');
const groupUpdate = require('./groupUpdate');
const groupUnassign = require('./groupUnassign');

let courseName;

router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error',`Login is required to access: '${req.originalUrl}'`);
		return res.redirect('/login');
    }
    
    courseName = req.data;

    let sql_query = `SELECT c.s_id, c.u_name, s.g_num, c.req_type
            FROM CourseEnrollments c
            LEFT OUTER JOIN StudentGroups s
            ON c.c_code = s.c_code
            AND c.s_id = s.s_id
            AND c.c_year = s.c_year
            AND c.c_sem = s.c_sem
            WHERE c.c_code = \'${req.params.cid}\'
            AND c.c_year = '${req.year}'
            AND c.c_sem = '${req.sem}'
            ORDER BY c.req_type, c.s_id`;

	pool.query(sql_query, (err, data) => {
        res.render('group', {
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
}, groupCreate);

router.use('/assign', function(req, res, next) {
	next()
}, groupAssign);

router.use('/update', function(req, res, next) {
	next()
}, groupUpdate);

router.use('/unassign', function(req, res, next) {
	next()
}, groupUnassign);

module.exports = router;