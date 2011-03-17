process.env.NODE_ENV = 'test';

var app = require('../chrono'),
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
          coll.createIndex('at', function (err, indexName) {
            var count = 0;
            var now = new Date().getTime(); 

            for (var idx = 0; idx < 1000; idx++) {
              var doc = { at: new Date(now - (idx*60*60*1000)), k: modelName, v: (Math.random() * 1000) };
              coll.insert(doc, function (err, coll) {
                count += 1;
                if (count == 1000) {
                  next();
                }
              });
            }
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

  'GET /metrics/logins': function(){
      assert.response(app,
        { url: '/metrics/logins' },
        { status: 200, headers: { 'Content-Type': 'application/json' }},
        function(res){
          var data = JSON.parse(res.body);
          assert.match(data[0][0].v.toString(), /^[\d\.]+$/);
        });
    },

    'GET /metrics/logins with query parameters': function(){
        var now = parseInt(new Date().getTime() / 1000);

        var _assert = function(window_count, count) {
          return function(res) {
            var data = JSON.parse(res.body);
//            console.log(data);
            assert.length(data, window_count);
            assert.length(data[0], count);
          };
        };
        var _response = { status: 200, headers: { 'Content-Type': 'application/json' }};

        assert.response(app,
          { url: '/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60) },
          _response,
          _assert(1, 1)
          );

        assert.response(app,
          { url: '/metrics/logins?start_time=' + (now - 120) + '&end_time=' + (now - 60) },
          _response,
          _assert(1, 0)
          );

        assert.response(app,
          { url: '/metrics/logins?start_time=' + (now + 60) + '&end_time=' + (now + 120) },
          _response,
          _assert(1, 0)
          );

        assert.response(app,
          { url: '/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60) + "&previous=4" },
          _response,
          _assert(4, 1)
          );
      },

  'POST /metrics': function() {
    assert.response(app,
      { url: '/metrics', method: 'POST', headers: { 'content-type': 'application/json' }, data: JSON.stringify({ k: 'logins', v: 4, at: parseInt(Number(new Date())/1000) }) },
      { status: 201, headers: { 'Content-Type': 'text/html; charset=utf8' }, body: '' },
      function(res){});
  },
};