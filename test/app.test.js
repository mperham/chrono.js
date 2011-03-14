process.env.NODE_ENV = 'test';

var app = require('../app'),
  assert = require('assert'),
  path = require('path'),
  fs = require('fs'),
  assert = require('assert'),
  zombie = require('zombie'),
  events = require('events');

var models = ['logins', 'searches', 'registrations'];

function removeTestData(models, next) {
  var modelCount = models.length;
	db.open(function(err, ignored) {
	  models.forEach(function(modelName) {
			db.collection(modelName, function(err, collection) {
				collection.remove(function(err, coll) {
					collection.createIndex('at', function (err, coll) {
				    modelCount--;
			      if (modelCount === 0) next();
					});
				});
			});
    });
  });
}

(function() {
  // The app needs to run for Zombie to test it
//  app.listen(3001);

  // Clear tests on each run
  removeTestData(models, function() {
		console.log("Setup complete");
    // Fixtures
		
    // var user = new app.User({'email' : 'alex@example.com', 'password' : 'test' });
    // user.save(start);
  });
})();

function teardown() {
  removeTestData(models, function() {
    process.exit();
  });
}

module.exports = {
  'GET /': function(){
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf8' }},
      function(res){
        assert.includes(res.body, '<option value="logins"');
      });
  },

	'POST /metrics': function() {
    assert.response(app,
      { url: '/metrics', method: 'POST', headers: { 'content-type': 'application/json' }, data: JSON.stringify({ k: 'logins', v: 4, at: parseInt(Number(new Date())/1000) }) },
    	{ status: 201, headers: { 'Content-Type': 'text/html; charset=utf8' }, body: '' },
      function(res){});
	},
};