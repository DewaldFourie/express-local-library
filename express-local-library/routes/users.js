var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// creating a new route, for testing purpose (http://localhost:3000/users/user1test)
router.get('/user1test', function(req, res, next) {
  res.send('This is the testing Route for user1');
});

module.exports = router;

