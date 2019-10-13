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
		req.flash('error','Login is required to access dashboard');
		return res.redirect('/login');
    }
    
    res.render('forum', {
        isCourse: req.isCourse, 
        username: req.user.u_name,
        accountType: req.user.u_type,
        uid: req.user.u_id, 
        cid: req.cid,
        data: req.data
    });
});

router.get('/:forumId', function(req, res, next) {
    let ccode = req.cid;
  });

module.exports = router;