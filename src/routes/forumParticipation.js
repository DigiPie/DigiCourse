var express = require('express');
var router = express.Router({mergeParams: true})

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    // Authentication
	if (!req.user) {
		req.flash('error','Login is required.');
		return res.redirect('/login');
    }

    // Retrieve a list of students (not TA) who holds one of the top 5 ranking positions in forum participation.
    var get_top_student_participants =
	'WITH entriesPerForum AS '
    + ' ( SELECT u_username, u_name, f_topic, COUNT(u_username) as num_of_entries'
    + '   FROM Accounts NATURAL JOIN ForumEntries fe NATURAL JOIN Forums f'
    + '   WHERE c_code = $1'
    + '   AND c_year = $2'
    + '   AND c_sem = $3'
    + '   AND NOT EXISTS'
    + '   ( SELECT 1'
    + '     FROM Professors'
    + '     WHERE u_username = p_id'
    + '   )'
    + '   AND NOT EXISTS'
    + '   ( SELECT 1'
    + '     FROM Enrollments e'
    + '     WHERE e.s_id = u_username'
	+ '     AND e.c_code = $1'
    + '     AND e.c_year = $2'
    + '     AND e.c_sem = $3'
	+ '     AND e.req_type = 0'
    + '     AND e.req_status = \'TRUE\''
    + '   )'
    + '   GROUP BY u_username, f_topic'
    + '   ORDER BY num_of_entries desc'
    + ' )' 
    
    + ' SELECT ranked.*'
    + ' FROM'
    + ' ( SELECT epf.u_username, epf.u_name, te.total_entries, string_agg(epf.f_topic, \', \') AS most_participated_forums, epf.num_of_entries, DENSE_RANK() over (order by te.total_entries desc) as ranking'
    + '   FROM entriesPerForum epf LEFT JOIN '
    + '   ( SELECT u_username, COUNT(u_username) as total_entries'
    + '     FROM ForumEntries'
    + '     WHERE c_code = $1'
    + '     AND c_year = $2'
    + '     AND c_sem = $3'
    + '     GROUP BY u_username'
    + '   ) te'
    + '   ON epf.u_username = te.u_username'
    + '   WHERE NOT EXISTS'
    + '   ( SELECT *'
    + '     FROM entriesPerForum epf2'
    + '     WHERE epf.u_username = epf2.u_username'
    + '     AND epf.num_of_entries < epf2.num_of_entries'
    + '   )'
    + '   GROUP BY epf.u_username, epf.u_name, te.total_entries, epf.num_of_entries'
    + ' ) ranked'
    + ' WHERE ranked.ranking <= 5'
    + ' GROUP BY ranked.u_username, ranked.u_name, ranked.total_entries, ranked.most_participated_forums, ranked.num_of_entries, ranked.ranking'
    + ' ORDER BY ranked.ranking';

    // Retrieve a list of teaching assistants who holds the rank of the top 5 forum participation.
    var get_top_teaching_participants =
	'WITH entriesPerForum AS '
    + ' ( SELECT u_username, u_name, f_topic, COUNT(u_username) as num_of_entries'
    + '   FROM Accounts NATURAL JOIN ForumEntries fe NATURAL JOIN Forums f'
    + '   WHERE c_code = $1'
    + '   AND c_year = $2'
    + '   AND c_sem = $3'
    + '   AND NOT EXISTS'
    + '   ( SELECT 1'
    + '     FROM Professors'
    + '     WHERE u_username = p_id'
    + '   )'
    + '   AND EXISTS'
    + '   ( SELECT 1'
    + '     FROM Enrollments e'
    + '     WHERE e.s_id = u_username'
	+ '     AND e.c_code = $1'
    + '     AND e.c_year = $2'
    + '     AND e.c_sem = $3'
	+ '     AND e.req_type = 0'
    + '     AND e.req_status = \'TRUE\''
    + '   )'
    + '   GROUP BY u_username, f_topic'
    + '   ORDER BY num_of_entries desc'
    + ' )' 
    
    + ' SELECT ranked.*'
    + ' FROM'
    + ' ( SELECT epf.u_username, epf.u_name, te.total_entries, string_agg(epf.f_topic, \', \') AS most_participated_forums, epf.num_of_entries, DENSE_RANK() over (order by te.total_entries desc) as ranking'
    + '   FROM entriesPerForum epf LEFT JOIN '
    + '   ( SELECT u_username, COUNT(u_username) as total_entries'
    + '     FROM ForumEntries'
    + '     WHERE c_code = $1'
    + '     AND c_year = $2'
    + '     AND c_sem = $3'
    + '     GROUP BY u_username'
    + '   ) te'
    + '   ON epf.u_username = te.u_username'
    + '   WHERE NOT EXISTS'
    + '   ( SELECT *'
    + '     FROM entriesPerForum epf2'
    + '     WHERE epf.u_username = epf2.u_username'
    + '     AND epf.num_of_entries < epf2.num_of_entries'
    + '   )'
    + '   GROUP BY epf.u_username, epf.u_name, te.total_entries, epf.num_of_entries'
    + ' ) ranked'
    + ' WHERE ranked.ranking <= 5'
    + ' GROUP BY ranked.u_username, ranked.u_name, ranked.total_entries, ranked.most_participated_forums, ranked.num_of_entries, ranked.ranking'
    + ' ORDER BY ranked.ranking';

    
	pool.query(get_top_student_participants, [req.cid, req.year, req.sem], (err, students) => {
        pool.query(get_top_teaching_participants, [req.cid, req.year, req.sem], (err, teaching) => {
            res.render('forumParticipation', {
                isCourse: req.isCourse,
                username: req.user.u_name,
                accountType: req.user.u_type, 
                cid: req.cid,
                data: req.data,
                students: students.rows,
                teaching: teaching.rows
            });
        });
    });
});

module.exports = router;