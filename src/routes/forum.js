var express = require('express');
var router = express.Router({mergeParams: true})

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/**** Routing ****/
router.get('/', function(req, res, next) {
    res.render('forum', {
        isCourse: req.isCourse, 
		username: req.username,
		accountType: req.accountType, 
        ccode: req.ccode,
        data: req.data
    });
});

router.get('/:forumId', function(req, res, next) {
    let ccode = req.ccode;
    let forumId = req.params.forumId;
  });

module.exports = router;