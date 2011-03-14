
/**
 * Module dependencies.
 */
var _ = require('underscore')._,
    backbone = require('backbone'),
    express = require('express'),
    mongodb = require('mongodb'),
    mustache = require('mustache');

var tmpl = {
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};
                if (options.body) // for express.js > v1.0
                    locals.body = options.body;
                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};

var app = module.exports = express.createServer();

db = new mongodb.Db('chrono_metrics_' + app.settings.env, new mongodb.Server('localhost', 27017, {}));
db.addListener("error", function(error) {
  console.log("Error connecting to mongodb -- perhaps it isn't running?");
});


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view options", {layout: false});
  app.register(".mustache", tmpl);
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
		  pro =	_(names).chain()
				.pluck('name')
				.map(function(x) { return x.substr(x.indexOf('.') + 1); })
				.reject(function(x) { return (x.indexOf('system.') == 0); })
				.value();
		  res.render('index.mustache', {
		    locals: {
		      metrics: pro
		    }
		  });
		});
  });
});

app.post('/metrics', function(req, res) {
	hash = req.body

	doc = { at: new Date(hash.at * 1000), v: hash.v.to_f, ip: req.connection.remoteAddress, k: hash['k'] }
	db.open(function(err, ignored) {
		db.collection(doc.k, function(err, coll) {
			coll.insert(doc, function (err, coll) {
				db.close();
			  res.send('', 201);
			});
		});
	});
});


function query() {
	return {};
}

app.get('/metrics/:name', function(req, res) {
	db.open(function(err, ignored) {
		db.collection(req.params.name, function(err, coll) {
			coll.find(query(), { sort: [['at', 1]] }, function (err, cursor) {
				cursor.toArray(function (err, results) {
					db.close();
				  res.send(results, 200);
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
					count = 0
					for (var idx = 0; idx < 100; idx++) {
						doc = { at: new Date(now - (idx*60*1000)), k: req.params.name, ip: req.connection.remoteAddress, v: (Math.random() * 1000) }
						coll.insert(doc, function (err, coll) {
							count += 1;
							if (count == 100) {
								db.close();
							  res.send('', 201);
							}
						});
					}
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
