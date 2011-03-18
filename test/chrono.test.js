process.env.NODE_ENV = 'test';

var app = require('../chrono');
var assert = require('assert');
var tobi = require('tobi');
var _ = require('underscore')._;

var models = { logins: 1000, searches: 0, registrations: 0 };

function initializeDb(next) {
  var count = 0;
  db.open(function(err, ignored) {
    if (err) console.log(err.stack);
    _.each(models, function(totalCount, modelName) {
      db.collection(modelName, function(err, collection) {
        if (err) console.log(err.stack);
        collection.remove(function(err, coll) {
          if (err) console.log(err);
          coll.createIndex('at', function (err, indexName) {
            if (err) console.log(err);
            var now = new Date().getTime();

            if (totalCount > 0) {
              var complete = 0;
              _.times(totalCount, function (idx) {
                var doc = { at: new Date(now - (idx*60*60*1000)), k: modelName, v: (Math.random() * 1000) };
                coll.insert(doc, function (err, coll) {
                  complete += 1;
                  if (complete == totalCount) {
                    count += 1;
                    if (count == _.size(models)) {
                      console.log("DB load complete, starting tests")
                      db.close();
                      next();
                    }
                  }
                });
              });
            } else {
              count += 1;
              if (count == _.size(models)) {
                console.log("DB init complete, starting tests")
                db.close();
                next();
              }
            }
          });
        });
      });
    });
  });

}

initializeDb(function() {

  exports['GET /'] = function() {
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf8' }},
      function(res){
        assert.includes(res.body, '<option value="logins"');
      });
  }

  exports['POST /metrics'] = function() {
    assert.response(app,
      { url: '/metrics', method: 'POST', headers: { 'content-type': 'application/json' }, data: JSON.stringify({ k: 'registrations', v: 4, at: parseInt(Number(new Date())/1000) }) },
      { status: 201, headers: { 'Content-Type': 'text/html; charset=utf8' }, body: '' }
    );
  }

  exports['GET /metrics/logins'] = function() {
    assert.response(app,
      { url: '/metrics/logins' },
      { status: 200, headers: { 'Content-Type': 'application/json' }},
      function(res){
        var data = JSON.parse(res.body);
        assert.ok(_.isArray(data), 'Result is not an array');
        assert.match(data[0][0].v.toString(), /^[\d\.]+$/);
      });
  }
  
  var assertResults = function(window_count, count) {
    return function(res) {
      var data = JSON.parse(res.body);
      assert.length(data, window_count);
      assert.length(data[0], count);
    };
  };
  var now = parseInt(new Date().getTime() / 1000);
  var _response = { status: 200, headers: { 'Content-Type': 'application/json' }};

  exports['GET /metrics/logins current'] = function() {
    assert.response(app,
      { url: '/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60) },
      _response,
      assertResults(1, 1)
      );
  }

  exports['GET /metrics/logins past'] = function() {
    assert.response(app,
      { url: '/metrics/logins?start_time=' + (now - 120) + '&end_time=' + (now - 60) },
      _response,
      assertResults(1, 0)
      );
  }

  exports['GET /metrics/logins future'] = function() {
    assert.response(app,
      { url: '/metrics/logins?start_time=' + (now + 60) + '&end_time=' + (now + 120) },
      _response,
      assertResults(1, 0)
      );
  }

  exports['GET /metrics/logins with previous weeks'] = function() {
    assert.response(app,
      { url: '/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60) + "&previous=4" },
      _response,
      assertResults(4, 1)
      );
  }

});

