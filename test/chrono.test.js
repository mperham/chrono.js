process.env.NODE_ENV = 'test';

var app = require('../chrono');
var assert = require('assert');
var tobi = require('tobi');
var _ = require('underscore')._;

var browser;
var testCount;
var models = { logins: 1000, searches: 0, registrations: 0 };

function startServer(fn) {
  var server = app;
  server.listen(3000);
  server.on('listening', function() {
    browser = tobi.createBrowser(3000, '127.0.0.1');
    fn(browser, function() {
      testCount--;
      if (testCount == 0) {
        server.close();
      }
    });
  });
}

function startup(runTests) {
  initializeDb(function() {
    startServer(runTests)
  });
}

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

startup(function(browser, done) {

  exports['GET /'] = function() {
    browser.get('/', function(res, $) {
      assert.equal(res.statusCode, 200);
      assert.length($("option"), 3);
      done();
    });
  }

  exports['POST /metrics'] = function() {
    browser.post('/metrics', { 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ k: 'registrations', v: 4, at: parseInt(Number(new Date())/1000) })
      }, function(res, $) {
        assert.equal(res.statusCode, 201);
        assert.match(res.headers['content-type'], /text\/html/);
        done();
    });
  }

  exports['GET /metrics/logins'] = function() {
    browser.get('/metrics/logins', function(res, data) {
      assert.equal(res.statusCode, 200);
      assert.equal(res.header('Content-Type'), 'application/json')
      assert.ok(_.isArray(data), 'Result is not an array');
      assert.match(data[0][0].v.toString(), /^[\d\.]+$/);
      done();
    });
  }
  
  var assertResults = function(window_count, count, res, data) {
    assert.equal(res.statusCode, 200);
    assert.equal(res.header('Content-Type'), 'application/json')
    assert.length(data, window_count);
    assert.length(data[0], count);
  };
  var now = parseInt(new Date().getTime() / 1000);

  exports['GET /metrics/logins current'] = function() {
    browser.get('/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60), function(res, data) {
      assertResults(1, 1, res, data);
      done();
    });
  }

  exports['GET /metrics/logins past'] = function() {
    browser.get('/metrics/logins?start_time=' + (now - 120) + '&end_time=' + (now - 60), function(res, data) {
      assertResults(1, 0, res, data);
      done();
    });
  }

  exports['GET /metrics/logins future'] = function() {
    browser.get('/metrics/logins?start_time=' + (now + 60) + '&end_time=' + (now + 120), function(res, data) {
      assertResults(1, 0, res, data);
      done();
    });
  }

  exports['GET /metrics/logins with previous weeks'] = function() {
    browser.get('/metrics/logins?start_time=' + (now - 60) + '&end_time=' + (now + 60) + "&previous=4", function(res, data) {
      assertResults(4, 1, res, data);
      done();
    });
  }

  testCount = _.size(exports);
});

