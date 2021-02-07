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

let canvas_width = 500;
let canvas_height = 500;
getData();

//let [drives, power_profile] = processData(data);

function make_chart(drives, power_profile) {
	// the axes will sit in the margin, so make them big enough
	console.log(power_profile);
	const margin = {top: 10, right: 10, bottom: 20, left: 50},
		graph_width = canvas_width - margin.left - margin.right,
		graph_height = canvas_height - margin.top - margin.bottom;

	const svg = d3.select("#dataviz_area")
		.append("svg")
			.attr("width", canvas_width)
			.attr("height", canvas_height)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

	// x scale and axis
	const x = d3.scaleLinear()
		.domain([0,power_profile.length])
		.range([0,graph_width]);
	svg
		.append('g')
		.attr("transform", "translate(0," + graph_height + ")")
		.call(d3.axisBottom(x));

	// y scale and axis
	const y = d3.scaleLinear()
		.domain([d3.min(power_profile, i => i.power), d3.max(power_profile, i => i.power)]) 
		.range([graph_height,0]);
	svg
		.append('g')
		.call(d3.axisLeft(y));

	// add the data
	svg
		.append("path")
		.datum(power_profile)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1.5)
		.attr("d", d3.line()
			.x(function(d) { return x(d.stroke_num) })
			.y(function(d) { return y(d.power) })
		)
}

function getData() {
	let start_time = 0;
	d3.csv("sample-data/th-10min.2021-02-07.csv", function(d) { 
		// make workout time an offset from zero (comes in as time since boot)
		if(start_time == 0) {
			start_time = d.workout_time_usec;
		}
		return {
			workout_offset: d.workout_time_usec - start_time,	
			stroke_time: +d.stroke_time_usec,	
			tick_duration: +d.tick_duration_usec,	
			inst_drag: +d.inst_drag,	
			stroke_power: +d.stroke_power,	
			inst_spm: +d.inst_spm,	
		};		
	}).then(processData);
};

function processData(d) {
	// remove recovery rows
	let drives = d3.filter(d, i => i.tick_duration > 0);
	console.log(drives);

	let stroke_count = 0;
	let power_profile = [{stroke_num: 1, power: 0}];

	// get stroke count and total power for each stroke
	drives.forEach(drive => {
		if (drive.stroke_time == 0) {
			// first row of a new stroke!
			stroke_count += 1;
			power_profile[stroke_count] = {
					stroke_num: stroke_count + 1, 
					power: drive.stroke_power
			};
		} else {
			// update the power_profile entry for this stroke
			new_power = drive.stroke_power;
			if (new_power > power_profile[stroke_count].power) {
				power_profile[stroke_count].power = new_power;
			}
		};
	});

	console.log(stroke_count);
	make_chart(drives, power_profile);
}
