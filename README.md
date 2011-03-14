Chrono.js
=========

Chrono is a storage and query server for time-series 'application' metrics.  Systems like Ganglia, Cactus and Nagios work well for 'technical' metrics like CPU usage, load average, RAM usage, etc.  Chrono wants to store the application metrics you'd use to monitor the health and well being of your website, for instance, # of logins, credit card transactions, search queries, etc.  Essentially anything you'd want to track by hostname (per machine) would be considered a 'technical' metric and not appropriate for Chrono.


Design
------------

Chrono provides the following functionality:

 - Server which provides REST APIs to write metric values and read aggregate metric data
 - Automatic aggregation of metric values into 5, 15, 60, 240 and 1440 minute buckets.
 - Warning and error visualization for metrics based on standard deviations from values in previous time periods.
 - Sample Ruby client for the REST API
 - Javascript graphing library

Chrono does everything in UTC.  The UI does not have provisions for local time zones; the idea is that distributed team communication is so much easier when everyone uses the same standard time zone.


Installation and Usage
------------------------

Chrono is 100% JavaScript, using Node.js and Express on the server-side and Protovis, jQuery and other libraries on the
client side.

On OSX, you can use Homebrew to install MongoDB:

    brew install mongodb
    
	mongod run --config /usr/local/Cellar/mongodb/1.6.5-x86_64/mongod.conf


Running
------------

For testing and evaluation you can run the server as a normal process by running:

    node chrono.js


Author
----------

Mike Perham, mperham@gmail.com, [mikeperham.com](http://mikeperham.com), [@mperham](http://twitter.com/mperham)


Copyright
-----------

Copyright (c) 2011 Mike Perham. See LICENSE for details.
