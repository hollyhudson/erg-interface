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
 *
 */


let start_time = 0;
let inst_power = 0; 
let total_power = 0; 
let stroke_power = 0; 
let stroke_time = 0;
let tick_duration = 0;
let inst_spm = 0;
let total_strokes = 0;
let current_speed = 0;

// 1920 x 1080 (16x9)
const canvas_width = 1920; // (170) 853 | 342 | 853
const canvas_height = 1080; // (102) 1125/411 | 1536 | 714/411/411
const speedometer_height = Math.round(canvas_height * 11 / 15);
const meter_width = Math.round(canvas_width * 5 / 12);
const meter_height = Math.round(canvas_height * 4 / 15);
const power_bar_width = Math.round(canvas_width * 2 /12);
const p_curve_height = Math.round(canvas_height * 7 / 15);

let dashboard = d3.select("#dashboard").append("svg")
	.attr("width", canvas_width)
	.attr("height", canvas_height)
	.call(responsive_resize);

let speedometer = dashboard.append("svg")
	.attr("x", 0)
	.attr("y", 0);

let speed_text = speedometer
	.append("text")
		.style("fill", "#0ff")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", speedometer_height/2)
		.attr("text-anchor", "middle")
		.text("speedometer goes here");

let cadence_meter = dashboard.append("svg")
	.attr("x", 0)
	.attr("y", speedometer_height);

let cadence_text = cadence_meter
	.append("text")
		.style("fill", "#8af")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("cadence goes here");

let power_bar = dashboard.append("svg")
	.attr("x", meter_width)
	.attr("y", 0);

power_bar
	.append("text")
		.style("fill", "#fa0")
		.style("font", "25px monospace")
		.attr("x", power_bar_width/2)
		.attr("y", canvas_height/2)
		.attr("text-anchor", "middle")
		.text("power bar goes here");

let power_curve = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", 0);

power_curve
	.append("text")
		.style("fill", "#fa0")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", p_curve_height/2)
		.attr("text-anchor", "middle")
		.text("power curve goes here");
	
let power_meter = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height);

let power_text = power_meter
	.append("text")
		.style("fill", "#fa0")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("power meter goes here");

let time_meter = dashboard.append("svg")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height + meter_height);

let time_text = time_meter
	.append("text")
		.style("fill", "#fff")
		.style("font", "25px monospace")
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
connection.onmessage = function (e) {
	console.log('Server: ', e.data);
	if (e.data == "Connected")
		return;

	new_data = e.data.split(',');

	// update variables
	stroke_time = new_data[1];
	inst_spm = new_data[5] / 10.0;
	tick_duration = new_data[2];
	inst_power = new_data[3] / 5000000.0;
	stroke_power = new_data[4] / 5000000.0;


	/******  DISPLAY TIME ******/

	// if this is the first time through the loop, create a time offset
	if(start_time == 0) {
		start_time = (new_data[0]); 	
	}

	microsec = new_data[0] - start_time;
	// to get sec divide by 1,000,000
	total_sec = microsec / 1000000;
	// to get min from this divide by 60
	min = total_sec / 60;
	// to get seconds from that mod 60
	sec = total_sec % 60;

	let display_min = parseInt(min);
	let display_sec = parseInt(sec);

	// left pad
	if (display_min == 0)
		display_min = "00";
	else
	if (display_min < 10)
		display_min = "0" + display_min;

	if (display_sec == 0)
		display_sec = "00";
	else
	if (display_sec < 10)
		display_sec = "0" + display_sec;

	time_text.text(display_min + ":" + display_sec);
	
	/******  DISPLAY CADENCE ******/
		
	if (stroke_time == 0)
	{
		total_strokes++;
	}
	
	cadence_text.text(parseInt(inst_spm));

	/******  DISPLAY POWER ******/

	// update total power
	if (tick_duration > 0) {
		total_power += inst_power;
	}

	power_text.text(parseInt(total_power) + " effort units"); 
	
	/******  DISPLAY SPEED ******/
	
	// speed is calculated here by effort/min
	

	/******  DISPLAY SPLIT ******/
	
	// splits are calculated here by seconds/600 units of effort
};

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
