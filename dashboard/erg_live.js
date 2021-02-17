/*
 * Future code:
 * let interval = setInterval(function() {
        updateData();
 * }, 5000);  // update every 5 sec
 */

/*
 * Components:
 * speed meter                      | power  |  curve
 * split (text) inside speed meter  |  bar   |
 *                                  |        |  total power (text & bar)
 * ---------------------------------|        |--------------------------
 * cadence (spm)                    |        |  total time
 *      ::: 5 :::                     ::2::          ::: 5 :::
 */

/*
 * Here power, work, and effort are all used interchangeably.
 * We can produce a measure of effort during rowing that can be used to
 * compare changes over time and between users, but without calibrating
 * with a standardized on-water rowing environment or with a Concept2 these
 * units cannot be translated into distance or watts.  As such we are 
 * calling them simply "units of effort".
 */

const drag_const = 0.00001;
const dt = 100;	// milliseconds, for when to update physics

let start_time = 0;
let inst_power = 0; 
let total_power = 0; 
let stroke_power = 0; 
let stroke_time = 0;
let tick_duration = 0;
let inst_spm = 0;
let total_strokes = 0;
let velocity = 0;
let current_speed = 0;
let distance = 0;

// 1920 x 1080 (16x9)
const canvas_width = 1920; // (170) 853 | 342 | 853
const canvas_height = 1080; // (102) 1125/411 | 1536 | 714/411/411
const speedometer_height = Math.round(canvas_height * 11 / 15);
const meter_width = Math.round(canvas_width * 5 / 12);
const meter_height = Math.round(canvas_height * 4 / 15);
const power_bar_width = Math.round(canvas_width * 2 /12);
const p_curve_height = Math.round(canvas_height * 7 / 15);
const margin_top = 20;
const margin_bottom = 20;
const margin_left = 20;
const margin_right = 20;

let dashboard = d3.select("#dashboard")
	.append("svg")
		.attr("width", canvas_width)
		.attr("height", canvas_height)
		.call(responsive_resize);

let speedometer = dashboard
	.append("svg")
		.attr("x", 0)
		.attr("y", 0);

let speed_text = speedometer
	.append("text")
		.attr("class", "speed")
		.attr("x", meter_width/2)
		.attr("y", speedometer_height/2)
		.attr("text-anchor", "middle")
		.text("speedometer goes here");

let cadence_meter = dashboard.append("svg")
	.attr("x", 0)
	.attr("y", speedometer_height);

let cadence_text = cadence_meter
	.append("text")
		.attr("class", "cadence")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("cadence goes here");

// POWER

let power_bar = dashboard.append("svg")
	.attr("x", meter_width + margin_left)
	.attr("y", 0 + margin_top);

const power_bar_graph_width = power_bar_width - margin_left - margin_right;
const power_bar_graph_height = canvas_height - margin_top - margin_bottom;
const y_power_bar = d3.scaleLinear()
		.range([power_bar_graph_height,0]) 	// pixels
		.domain([0,100]);					// data

power_bar.selectAll("rect")
	.data([0])
	.enter()
	.append("rect")
		//.attr("class", "power_bar")
		.attr("fill", "#fa0")
		.attr("x", 0)
		.attr("width", power_bar_graph_width);

/*

let power_bar_rect = power_bar
	.datum(50)
	.append("rect")
		.attr("x", 0)
		.attr("y", function(d) { return y_power_bar(d); })
		.attr("width", power_bar_graph_width)
		.attr("height", function(d) { return power_bar_graph_height - y_power_bar(d); })
		.style("fill", color_power);

power_bar
	.append("text")
		.style("fill", color_power)
		.style("font", "25px monospace")
		.attr("x", power_bar_width/2)
		.attr("y", canvas_height/2)
		.attr("text-anchor", "middle")
		.text("power bar goes here");
*/

let power_curve = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", 0);

power_curve
	.append("text")
		.attr("x", meter_width/2)
		.attr("y", p_curve_height/2)
		.attr("text-anchor", "middle")
		.text("power curve goes here");
	
let power_meter = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height);

let power_text = power_meter
	.append("text")
		.attr("class", "power_meter")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("power meter goes here");

let time_meter = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height + meter_height);

let time_text = time_meter
	.append("text")
		.attr("class", "time_meter")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("time goes here");

// connect to the rower's websocket and append any new data as it comes in
let host = location.hostname;

//if (!host)
	host = "192.168.178.51";

let connection = new WebSocket('ws://' + host + ':81/', ['arduino']);
connection.onopen = function () { connection.send('Connect ' + new Date()); };
connection.onerror = function (error) { console.log('WebSocket Error ', error);};

// update with new data as received
connection.onmessage = function(d) {
	console.log('Server: ', d.data);
	if (d.data == "Connected")
		return;

	new_data = d.data.split(',');

	if (new_data[0] == "time_usec") { return; }

	// update variables 
	d = {
		timestamp: +new_data[0],
		stroke_time: +new_data[1],
		inst_spm: new_data[5] / 10.0,
		tick_duration: +new_data[2],
		inst_power: +new_data[3],
		stroke_power: +new_data[4],
	}

	//----------  DISPLAY TIME --------------------------//

	// if this is the first row of data, create a time offset
	if(d.timestamp == 0) {
		start_time = d.timestamp; 	
		setInterval(update_physics, 100);	
	}

	microsec = d.timestamp - start_time;
	// to get sec divide by 1,000,000
	total_sec = microsec / 1000000;
	// to get min from this divide by 60
	raw_min = total_sec / 60;
	// to get seconds from that mod 60
	raw_sec = total_sec % 60;

	let min = parseInt(raw_min);
	let sec = parseInt(raw_sec);

	// left pad
	if (min == 0)
		display_min = "00";
	else
	if (min < 10)
		display_min = "0" + min;
	else
		display_min = min;

	if (sec == 0)
		display_sec = "00";
	else
	if (sec < 10)
		display_sec = "0" + sec;
	else
		display_sec = sec;

	time_text.text(display_min + ":" + display_sec);
	
	//----------  DISPLAY CADENCE --------------------------//
		
	if (d.stroke_time == 0)
	{
		total_strokes++;
	}
	
	cadence_text.text("cadence: " + d.inst_spm + "spm, distance: "
		+ distance + "m?");

	//----------  DISPLAY POWER --------------------------//

	// update total power
	if (d.tick_duration > 0) {
		total_power += d.inst_power;
	}
	console.log("power: " + d.inst_power);

	power_text.text(parseInt(total_power) + " effort units"); 

	let pb = power_bar.selectAll("rect")
		.data([d.inst_power]);
	
	pb
		.enter()
		.append('rect');

	pb
		.transition()
		.duration(100)
		//.attr('class', 'power_bar')
		.attr('y', d => y_power_bar(d) )
		.attr('height', d => power_bar_graph_height - y_power_bar(d) );

	pb
		.exit()
		.remove();
	
	//power_bar.rect.y(inst_power);
	//power_bar_rect.attr("height",  power_bar_graph_height - y_power_bar(d.inst_power));
	
	//----------  DISPLAY SPEED and SPLIT --------------------//
	
	// speed is calculated here by effort_unit/hr, which is the closest
	// analogy to distance/hr we can get without calibration with a C2
	// the constant on top represents the distance the belt/oars travelled
	velocity = 1e9 / d.tick_duration; // vel = displacement/change in time

	let raw_split = 500 / velocity; 
	let split = parseInt(raw_split);
	let split_min = split / 60;
	let split_sec = split % 60;

	speed_text.text(
		parseInt(velocity) + " m/s? speed and " 
		+ split_min + ":" + split_sec + " per 500m? split"
	);
};

function update_physics() {
	// decay velocity
	if (velocity <= 0) {
		velocity = 0;
	} else {
		// drag force equation 
		//velocity -= velocity * velocity * some constant
		velocity -= velocity * velocity * drag_const * dt;
	}

	// update current distance
	distance += velocity * dt;
}

function responsive_resize(svg) {
	// find the aspect ratio of the area being resized
	const container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style("width"), 10),
		height = parseInt(svg.style("height"), 10),
		aspect = width / height;

	svg
		.attr("viewBox",`0 0 ${width} ${height}`)
		.attr("preserveAspectRatio", "xMinYMid meet")
		.call(resize);
		
		d3.select(window).on("resize." + container.attr("id"), resize);

		function resize() {
			const target_width = parseInt(container.style("width"))
			svg
				.attr("width", target_width)
				.attr("height", Math.round(target_width / aspect));
		}
}
