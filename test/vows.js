process.env.NODE_ENV = 'test';

var app = require('../chrono'),
  assert = require('assert'),
  vows = require('vows'),
  tobi = require('tobi');
  
var browser = tobi.createBrowser(app);
  
vows.describe('Chrono.js').addBatch({
  'GET /metrics/logins': {
    topic: function() {
      return browser.get('/metrics/logins', this.callback);
    },
    'should return metric data': function(res, $) {
      assert.equal(res.statusCode, 200);
      assert.equal(res.header('Content-Type'), 'application/json')
      var data = res.body;
      assert.match(data[0][0].v.toString(), /^[\d\.]+$/);
    }
  },
  'GET /': {
    topic: function() {
      return browser.get('/', this.callback);
    },
    'should have a select with metric names': function(res, $) {
      assert.equal(res.statusCode, 200);
      assert.match(res.headers['content-type'], /text\/html/);
      // TODO Figure out why I can't access res.body or $ here.
//      assert.length($('option'), 4);
    },
  },
  // 'POST /metrics': {
  //   topic: function() {
  //     tobi.createBrowser(app).get('/', this.callback);
  //   }
  //   assert.response(app,
  //     { url: '/metrics', method: 'POST', headers: { 'content-type': 'application/json' }, data: JSON.stringify({ k: 'logins', v: 4, at: parseInt(Number(new Date())/1000) }) },
  //     { status: 201, headers: { 'Content-Type': 'text/html; charset=utf8' }, body: '' },
  //     function(res){});
  // },
  
}).export(module);