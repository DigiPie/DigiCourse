var express = require('express');
var router = express.Router({mergeParams: true});
const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

const groupsassign = require('./groupsassign');
var courseName;

router.get('/', function(req, res, next) {
    courseName = req.data;

    var sql_query =  
        `SELECT c.*, cs.enrolled
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
        WHERE c.c_id = '${req.cid}'`;
    
	pool.query(sql_query, (err, data) => {
        res.render('groups', {
            isCourse: req.isCourse, 
            username: req.username,
            accountType: req.accountType, 
            cid: req.cid,
            data: req.data,
            datarows: data.rows
        });
    });
    
});

router.post('/create', function(req, res, next) {
    var sql_query = `INSERT INTO CourseGroups VAlUES ('${req.body.c_id}', '${req.body.g_num}', '${req.body.g_capacity}')`;

	pool.query(sql_query, (err, data) => {
        if (err) {
            if (err.code == 23505) {
                req.flash('error', `This group number ${req.body.g_num} has already been created, please use another number.`);
                res.redirect(`/course/${req.body.c_id}/groups`);
            } else {
                res.status(err.status || 500);
                res.render('error', {
                    message: "Something went wrong during the creation of group, try again later.",
                    error: err
                });
            }
        } else {
            res.status(200).redirect('back');
        }
    });
    
});

router.use('/assign', function(req, res, next) {
	req.isCourse = true, 
	req.username = "Name",
	req.accountType = "Professor",
	req.cid = req.cid;
	req.data = courseName;
	next()
}, groupsassign);

module.exports = router;