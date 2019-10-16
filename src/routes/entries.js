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
		req.flash('error','Login is required');
		return res.redirect('/login');
	}
	
    var show_entries = 
    'SELECT fe.u_id, u_name, TO_CHAR(e_datetime, \'Dy Mon DD YYYY HH24:MI:SS\') e_datetime, e_content'
    + ' FROM ForumEntries fe JOIN Accounts a'
    + ' ON fe.u_id = a.u_id'
    + ' WHERE c_id = $1' 
    + ' AND f_datetime = $2';

	pool.query(show_entries, [req.cid, req.f_datetime], (err, entries) => {
		res.render('entries', {
			isCourse: req.isCourse,
			username: req.user.u_name,
			accountType: req.user.u_type, 
			cid: req.cid,
			data: req.data,
			f_topic: req.f_topic,
			f_datetime: req.f_datetime,
            entries: entries.rows
		});
	});
});

router.post('/post', function(req, res, next) {
    if (req.body.e_content == '') {
        req.flash('error', `Please enter content for the new forum entry`);
        res.redirect(`/course/${req.cid}/forum/${req.f_topic}/${req.f_datetime}/entries`);
        return;
    }

    var sql_query = `INSERT INTO ForumEntries VAlUES ('${req.cid}', '${req.f_datetime}', '${req.user.u_id}', to_timestamp(${Date.now()} / 1000), '${req.body.e_content}')`;

    pool.query(sql_query, (err, data) => {
        if (err) {
            req.flash('error', `Error. Please try again.`);
            res.status(err.status || 500).redirect('back');
        } else {
            req.flash('success', 'Successfully posted new entry');
            res.status(200).redirect('back');
        }
    });
    
});

module.exports = router;