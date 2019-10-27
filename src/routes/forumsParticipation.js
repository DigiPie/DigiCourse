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

    // Retrieve a list of students who holds the rank of the top 5 forum participation.
    var get_top_participants =
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
    + '   GROUP BY u_username, f_topic'
    + '   ORDER BY num_of_entries desc'
    + ' )' 
    
    + ' SELECT epf.u_username, epf.u_name, te.total_entries, epf.f_topic as most_Participated_forum, epf.num_of_entries'
    + ' from entriesPerForum epf LEFT JOIN '
    + ' ( SELECT u_username, COUNT(u_username) as total_entries, rank() over (order by COUNT(u_username) desc)'
    + '   FROM ForumEntries'
    + '   WHERE c_code = $1'
    + '   AND c_year = $2'
    + '   AND c_sem = $3'
    + '   GROUP BY u_username'
    + ' ) te'
    + ' ON epf.u_username = te.u_username'
    + ' WHERE NOT EXISTS'
    + ' ( SELECT *'
    + '   FROM entriesPerForum epf2'
    + '   WHERE epf.u_username = epf2.u_username'
    + '   AND epf.num_of_entries < epf2.num_of_entries'
    + ' )'
    + ' AND te.rank <= 5'
    + ' ORDER BY te.total_entries desc';
    
	pool.query(get_top_participants, [req.cid, req.year, req.sem], (err, participation) => {
        res.render('forumsParticipation', {
            isCourse: req.isCourse,
            username: req.user.u_name,
            accountType: req.user.u_type, 
            cid: req.cid,
            data: req.data,
            participation: participation.rows,
        });
    });
});

module.exports = router;