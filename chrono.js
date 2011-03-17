
/**
 * Module dependencies.
 */
var _ = require('underscore')._,
    express = require('express'),
    mongodb = require('mongodb'),
    jqtpl = require('jqtpl');

var app = module.exports = express.createServer();

db = new mongodb.Db('chrono_metrics_' + app.settings.env, new mongodb.Server('localhost', 27017, {}));
db.addListener("error", function(error) {
  console.log("Error connecting to mongodb -- perhaps it isn't running?");
});


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view options", {layout: false});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.logger());
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res) {
  db.open(function(err, ignored) {
    db.collectionNames(function(err, names) {
      db.close();
      pro = _(names).chain()
        .pluck('name')
        .map(function(x) { return x.substr(x.indexOf('.') + 1); })
        .reject(function(x) { return (x.indexOf('system.') == 0); })
        .value();
      idx = 0;
      res.render('index.html.jqtpl', {
        locals: {
          metrics: pro
        }
      });
    });
  });
});

app.post('/metrics', function(req, res) {
  var hash = req.body;

  var doc = { at: new Date(hash.at * 1000), v: hash.v.to_f, ip: req.connection.remoteAddress, k: hash['k'] };
  db.open(function(err, ignored) {
    db.collection(doc.k, function(err, coll) {
      coll.insert(doc, function (err, coll) {
        db.close();
        res.send('', 201);
      });
    });
  });
});


function query(req, weeks_ago) {
  var offset = weeks_ago * 60 * 60 * 24 * 7 * 1000;
  var default_start = (new Date().getTime() / 1000) - (2*24*60*60);
  var query = {}
  query.at = {} 
  query.at['$gte'] = new Date(req.param('start_time', default_start) * 1000 - offset);
  if (req.param('end_time', false)) {
    query.at['$lt'] = new Date(req.param('end_time') * 1000 - offset);
  }
  return query;
}

app.get('/metrics/:name', function(req, res) {
  db.open(function(err, ignored) {
    db.collection(req.params.name, function(err, coll) {
      var prev = parseInt(req.param('previous', 1));
      var overallResults = [];
      
      _.times(prev, function(idx) {
        coll.find(query(req, idx), { sort: [['at', 1]] }, function (err, cursor) {
          cursor.toArray(function (err, results) {
            overallResults[idx] = results;
            prev -= 1;
            if (prev == 0) {
              db.close();
              res.send(overallResults, 200);
            }
          });
        });
      });

    });
  });
});

app.get('/load/:name', function(req, res) {
  db.open(function(err, ignored) {
    now = new Date().getTime();
    db.collection(req.params.name, function(err, coll) {
      coll.remove(function(err, coll) {
        coll.createIndex('at', function (err, indexName) {
          var count = 0;
          var total = 1000;

          _.times(total, function (idx) {
            var doc = { at: new Date(now - (idx*60*60*1000)), k: req.params.name, ip: req.connection.remoteAddress, v: (40000 + (Math.random() * 20000)) };
            coll.insert(doc, function (err, coll) {
              count += 1;
              if (count == total) {
                db.close();
                res.send('Loaded ' + total + ' entries', 201);
              }
            });
          });
          
        });
      });
    });
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d, environment %s", app.address().port, app.settings.env)
}
