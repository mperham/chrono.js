function stdev(array) {
	avg = _(array).reduce(function(a, b) { return a + b; }, 0) / array.length;
	variance = _(array).reduce(function(a, b) { return a += Math.pow(b - avg, 2); }, 0) / array.length;
  	return Math.sqrt(variance);
}

function initGraph() {
	var w = 900,
	    h = 640,
	    fill = pv.colors("lightblue", "darkgray", "lightpink");

	var vis = new pv.Panel()
	    .width(w)
	    .height(h)
	    .margin(20)
	    .right(40);

	var metric = $('#metric :selected').val();

	var dataURL = "/metrics/" + metric + "?start_time=1+day+ago&end_time=1+minute+ago&previous=5";
	$.getJSON(dataURL, function(data) {
	  var variables = [metric];

	  (function() {
	    data[0].forEach(function(d, idx) {
	      d.at = new Date(d.at);
	      d.prev = [data[1][idx].v, data[2][idx].v, data[3][idx].v, data[4][idx].v, data[5][idx].v]
	    });
	  })();

	  var x = pv.Scale.linear(data[0], function(d) { return d.at; }).range(0, w - 40),
	      y = pv.Scale.linear(0, 70000).range(0, h);

	  vis.add(pv.Area)
	      .data(data[0])
	      .height(function(d) { return y(stdev(d.prev)*4); })
	      .bottom(function(d) { return y(d.v - (stdev(d.prev)*2)); })
		    .left(function(d) { return x(d.at) + 10; })
	      .fillStyle(function() { return 'rgba(224, 192, 224, .7)'; })
	      .strokeStyle(function() { return this.fillStyle().darker(); });

	  vis.add(pv.Bar) // visible bar
	    .data(data[0])
	    .bottom(0)
	    .width(function(d) { return 20; })
	    .height(function(d) { return y(d.v); })
		    .left(function(d) { return x(d.at); })
	    .title(function(d) { return d.v; })
	    .def("i", -1)
	    .event("mouseover", function() { return this.i(this.index); })
	    .event("mouseout", function() { return this.i(-1); })
	    .fillStyle(function() { return this.i() == this.index ? "yellow" : "lightgreen"; })
	    .strokeStyle(function() { return this.fillStyle().darker(); });

	  vis.add(pv.Label)
	      .data(x.ticks())
	      .left(x)
	      .bottom(0)
	      .textBaseline("top")
	      .textMargin(5)
	      .text(pv.Format.date("%H"));

	  vis.add(pv.Rule)
	      .data(y.ticks(10))
	      .bottom(y)
	      .strokeStyle(function(i) { return (i ? "rgba(255, 255, 255, .7)" : "black"); })
	    .anchor("right").add(pv.Label)
	      .textMargin(6);

	  vis.render();
	});
}