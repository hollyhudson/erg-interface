/*
 * (0,0)            (width,0)
 *
 * (0,height)  (width,height)
 */

/*
 * Scale: maps the data to the pixels on the screen
 *
 * x = d3.scaleLinear()
 *		.domain([0, 100])  <== min and max of the data values
 *		.range([0, 400]);  <== min and max of the pixels to place the data on
 *
 * y = d3.scaleLinear() ..etc 
 */

const canvas_width = 600;
const canvas_height = 500;

const orange = "#ff9101";

getData();

function make_chart(drives, power_profile) {
	// the axes will sit in the margin, so make them big enough
	console.log(power_profile);
	const margin = {top: 20, right: 10, bottom: 50, left: 50},
		graph_width = canvas_width - margin.left - margin.right,
		graph_height = canvas_height - margin.top - margin.bottom;

	// scale the ranges (pixels)
	const x = d3.scaleLinear().range([0,graph_width]);
	const y = d3.scaleLinear().range([graph_height,0]);

	// scale the domains (data)
	x.domain([0,power_profile.length]);
	y.domain(d3.extent(power_profile, function(d) { return d.power; }));

	// define the line
	let valueline = d3.line()
			.x(function(d) { return x(d.stroke_num) })
			.y(function(d) { return y(d.power) });

	// reference line for average power
	let avg_power = d3.mean(power_profile, d => d.power);
	let avg_power_line = d3.line()
			.x(function(d) { return x(d.stroke_num) })
			.y(function(d) { return y(avg_power) });

	// put the chart in the canvas
	let svg = d3.select("#dataviz_area")
		.append("svg")
			.attr("width", canvas_width)
			.attr("height", canvas_height)

		// transform the origin and draw the line
		.append("g")
			.attr("transform",
					"translate(" + margin.left + "," + margin.top + ")")

	// draw the power distribution line
	svg
		.append("path")
			.datum(power_profile)
			.attr("d", valueline)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", orange)
			.attr("stroke-width", 1.5);

	// draw the average power line
	svg
		.append("path")
			.datum(power_profile)
			.attr("d", avg_power_line)
			.attr("class", "line")
			.attr("fill", "none")
			.attr("stroke", "#d08770")
			.attr("stroke-width", 2);

	//transform the origin and draw the axes
	svg
		.append('g')
		.attr("class", "axis")
		.attr("transform", "translate(0," + graph_height + ")")
		.call(d3.axisBottom(x));
	svg
		.append('g')
		.attr("class", "axis")
		.call(d3.axisLeft(y))
		.select(".domain").remove();

	// header label
	svg
		.append("text")
		.attr("text-anchor", "center")
		.attr("x", graph_width/2)
		.attr("y", margin.top - 20)
		.attr("fill", "#fff")
		.attr("font-size", "20px")
		.text("power distribution");
	
	// label the x axis
	svg
		.append("text")
		.attr("class","x_label")
		.attr("text-anchor", "end")
		.attr("x", graph_width)
		.attr("y", graph_height + margin.top + 15)
		.attr("fill", "#fff")
		.text("stroke");

	// label the y axis
	svg
		.append("text")
		.attr("class","y_label")
		.attr("text-anchor", "start")
		.attr("x", 0 - margin.left)
		.attr("y", 0 - 8)
		.attr("fill", orange)
		//.attr("transform", "rotate(-90)")
		.text("power");
}

function getData() {
	let start_time = 0;
	d3.csv("sample-data/hh-20210208.csv", function(d) {

		// grab the first workout time stamp to use as a start time offset 
		if(start_time == 0) {
			start_time = d.workout_time_usec;
		}

		d = {
			workout_offset: d.workout_time_usec - start_time,	
			stroke_time: +d.stroke_time_usec,	
			tick_duration: +d.tick_duration_usec,	
			inst_drag: +d.inst_drag,	
			stroke_power: +d.stroke_power,	
			inst_spm: +d.inst_spm,	
		}

		// remove recovery rows
		if (d.tick_duration < 0) {
			return null;
		}
			
		// now add this row to the array of objects that d3.csv is creating
		return d;
	}).then(processData);
};

function processData(d) {

	// remove first tick because power is usually zero and appears as
	// an outlier that messes up our graph
	d.shift();	

	let stroke_count = 0;
	let power_profile = [{stroke_num: 1, power: 0}];

	// get stroke count and total power for each stroke
	d.forEach(d => {
		if (d.stroke_time == 0) {
			// first row of a new stroke!
			stroke_count += 1;
			power_profile[stroke_count] = {
					stroke_num: stroke_count + 1, 
					power: d.stroke_power
			};
		} else {
			// update the power_profile entry for this stroke
			new_power = d.stroke_power;
			if (new_power > power_profile[stroke_count].power) {
				power_profile[stroke_count].power = new_power;
			}
		};
	});

	console.log(stroke_count);
	make_chart(d, power_profile);
}
