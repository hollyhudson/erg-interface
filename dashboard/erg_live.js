/*
 * Components:
 * speed meter                      |  curve
 * split (text) inside speed meter  |
 *                                  |  total power (text & bar)
 * ---------------------------------|--------------------------
 *    spm		|  distance			|    time		|   power
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
const max_speed = 20;
let prev_timestamp = 0;

let csv_to_export = "";
let start_time = -1;
let inst_power = 0; 
let total_power = 0; 
let power_curve_line_data = [];
let highest_power = 0;
let stroke_power = 0; 
let stroke_time = 0;
let tick_duration = 0;
let inst_spm = 0;
let total_strokes = 0;
let velocity = 0;
let current_speed = 0;
let total_dist = 0;

const white = "#fff";
const orange = "#ff9101";
const red = "red";
const green = "#7eff24";
const cyan = "#04e7fb";
const grey = "#505150";
const speed_colors = ["#7eff24","#7eff79","#7effad","#7effff"];

// 1920 x 1080 (16x9)
const canvas_width = 1920; // (170) 853 | 342 | 853
const canvas_height = 1080; // (102) 1125/411 | 1536 | 714/411/411
const graphics_width = Math.round(canvas_width / 2);
const graphics_height = Math.round(canvas_height * 11 / 15);
const meter_width = Math.round(canvas_width / 4);
const meter_height = Math.round(canvas_height * 4 / 15);

let speedometer_area = d3.select("#speed-svg")
	.append("svg")
		.attr("class", "speedometer-area")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", graphics_width)
		.attr("height", graphics_height);

let speed_value = speedometer_area
	.append("text")
		.attr("class", "speed")
		.attr("class", "meter-value")
		.attr("x", graphics_width / 2) 
		.attr("y", graphics_height - graphics_height * 5 / 8)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("0");

let speed_label = speedometer_area
	.append("text")
		.attr("class", "speed")
		.attr("class", "meter-label")
		.attr("x", graphics_width / 2)
		.attr("y", graphics_height - graphics_height * 4 / 8)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("km/hr");

let speed_dial_arc = d3.arc()
	.outerRadius(300) // size is relative to container, so trying some nums
	.innerRadius(250)
	.cornerRadius(10)
	.startAngle(180 * Math.PI / 180)
	.endAngle(180 * Math.PI / 180);

let speed_dial = speedometer_area
	.append("path")
		.attr("transform", "translate(" 
						+ (graphics_width / 2) 
						+ ", "
						+ (graphics_height - graphics_height * 4.9 / 8)
						+ ")")
		.attr("d", speed_dial_arc)
		//.attr("fill", d => d.color);
		.style("fill", green);

let dial_scale = d3.scaleLinear()
    .domain([0,20])
    .range([180 * Math.PI / 180, (180 + 270) * Math.PI / 180]);

let split_value = speedometer_area
	.append("text")
		.attr("class", "speed")
		.attr("class", "meter-value")
		.attr("x", graphics_width / 2) 
		.attr("y", graphics_height - graphics_height * 1 / 10)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("00:00");

let split_label = speedometer_area
	.append("text")
		.attr("class", "speed")
		.attr("class", "meter-label")
		.attr("x", graphics_width / 2)
		.attr("y", graphics_height - graphics_height * 1 / 50)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("500m");

let cadence_meter = d3.select("#cadence-meter-svg")
	.append("svg")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", meter_width)
		.attr("height", meter_height);

let cadence_value = cadence_meter
	.append("text")
		.attr("class", "cadence")
		.attr("class", "meter-value")
		.attr("x", meter_width/2)
		.attr("y", meter_height - meter_height/2)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("0");

let cadence_label = cadence_meter
	.append("text")
		.attr("class", "cadence")
		.attr("class", "meter-label")
		.attr("x", meter_width/2)
		.attr("y", meter_height - meter_height/4)
		.attr("text-anchor", "middle")
		.style("fill", green)
		.text("spm");

// POWER

let power_curve_area = d3.select("#power-curve-svg")
	.append("svg")
		.attr("class", "power-curve-area")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", graphics_width)
		.attr("height", graphics_height);

// Set the scales for the power curve
let pc_x = d3.scaleLinear()
	.range([0, graphics_width])
	.domain([0, 900000]);
let pc_y = d3.scaleLinear()
	.range([graphics_height, 0])
	.domain([0, 20]);

// call this with an array of x,y points aka "data elements"
let power_curve_line = d3.line()
	.x(function(d) { return pc_x(d.time); })
	.y(function(d) { return pc_y(d.power); });

let p_curve_label = power_curve_area
	.append("text")
		.attr("class", "power-curve")
		.attr("class", "meter-label")
		.attr("x", graphics_width / 2)
		.attr("y", graphics_height - graphics_height / 4)
		.attr("text-anchor", "middle")
		.style("fill", orange)
		.text("power curve");
	
let power_meter = d3.select("#power-meter-svg")
	.append("svg")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", meter_width)
		.attr("height", meter_height);

let power_value = power_meter
	.append("text")
		.attr("class", "power_meter")
		.attr("class", "meter-value")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 2)
		.attr("text-anchor", "middle")
		.style("fill", orange)
		.text("0");

let power_label = power_meter
	.append("text")
		.attr("class", "power_meter")
		.attr("class", "meter-label")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 5)
		.attr("text-anchor", "middle")
		.style("fill", orange)
		.text("total power");

let time_meter = d3.select("#time-meter-svg")
	.append("svg")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", meter_width)
		.attr("height", meter_height);

let time_value = time_meter
	.append("text")
		.attr("class", "time-meter")
		.attr("class", "meter-value")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 2)
		.attr("text-anchor", "middle")
		.style("fill", white)
		.text("00:00");

let time_label = time_meter
	.append("text")
		.attr("class", "time-meter")
		.attr("class", "meter-label")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 5)
		.attr("text-anchor", "middle")
		.style("fill", white)
		.text("time");

let distance_meter = d3.select("#distance-meter-svg")
	.append("svg")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", meter_width)
		.attr("height", meter_height);

let distance_value = distance_meter
	.append("text")
		.attr("class", "distance-meter")
		.attr("class", "meter-value")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 2)
		.attr("text-anchor", "middle")
		.style("fill", cyan)
		.text("0");

let distance_label = distance_meter
	.append("text")
		.attr("class", "distance-meter")
		.attr("class", "meter-label")
		.attr("x", meter_width / 2)
		.attr("y", meter_height - meter_height / 5)
		.attr("text-anchor", "middle")
		.style("fill", cyan)
		.text("meters");

//------------------- PROCESS A MESSAGE -------------------//

// connect to the rower's websocket and append any new data as it comes in
let host = location.hostname;

//if (!host)
	host = "10.1.0.158";

let connection = new WebSocket('ws://' + host + ':81/', ['arduino']);
connection.onopen = function () { connection.send('Connect ' + new Date()); };
connection.onerror = function (error) { console.log('WebSocket Error ', error);};

// update with new data as received
connection.onmessage = function(d) {
	console.log('Server: ', d.data);
	if (d.data == "Connected")
		return;

	new_data = d.data.split(',');

	if (new_data[0] == "time_usec") { 
		// new workout!

		// start creating the downloadable csv object
		// grab the header row, then move on so we can start getting data
		csv_to_export = "time,stroke_count,inst_spm,total_power,inst_power,km_hr,km,tick_duration\n";
		return; 
	}

	// update variables 
	d = {
		timestamp: +new_data[0], // time since boot, not start of workout
		stroke_time: +new_data[1], // time since start of current stroke
		tick_duration: +new_data[2], 
		inst_power: +new_data[3], // instantaneous power/effort/work
		stroke_power: +new_data[4], // 
		inst_spm: +new_data[5], // instantaneous cadence measurement
		inst_vel: +new_data[6] / 5, // instantaneous velocity
		velocity: +new_data[7] / 5, // smoothed velocity, for speed
	}

	//----------  DISPLAY TIME --------------------------//

	// if this is the first row of data, create a time offset
	if (start_time < 0) {
		if (d.inst_power == 0) {
			// workout hasn't started yet
			return;
		} else {
			// workout has started, record first useable timestamp
			start_time = d.timestamp; 	
			prev_timestamp = d.timestamp;
			highest_power = d.inst_power;
		}
	}

	time_microsec = d.timestamp - start_time;
	time_value.text(format_time(time_microsec));
	csv_to_export += time_microsec + ",";
	
	//----------  DISPLAY CADENCE --------------------------//
		
	if (d.stroke_time == 0)
	{
		total_strokes++;

		// grey out old power curves
		power_curve_area.selectAll('.power-curve')
			.attr("class", "old-power-curve")
			.style("stroke", grey)
			.style("stroke-opacity", 0.5)
			.style("stroke-width", 1)
			.classed("power-curve", false);

		// initiate a new power curve path
		// replace old array
		power_curve_line_data = [];

		// append a new power curve for this stroke
		power_curve_area
			.append("path")
				.attr("class", "power-curve")
				.style("fill", "none")
				.style("stroke", orange)
				.style("stroke-width", 3);

	cadence_value.text(parseInt(d.inst_spm));
	csv_to_export += total_strokes + "," + d.inst_spm + ",";	

	//----------  DISPLAY POWER --------------------------//

	// update total power
	if (d.tick_duration > 0) {
		total_power += d.inst_power;
	}

	// if we have a new highest power reading, create a new high point line
	if (highest_power < d.inst_power) { 
		highest_power = d.inst_power;
	}
	
	// only update the power curve if we're actually doing power
	if (d.inst_power > 0) {
		power_curve_line_data.push({
			time: d.stroke_time, 
			power: d.inst_power,
		});

		// update the power curve
		power_curve_area.select(".power-curve")
			.attr("d", power_curve_line(power_curve_line_data));
			//.attr("fill", "none");
	}

	//p_curve_value.text(parseInt(d.inst_power)); 
	power_value.text(parseInt(total_power)); 
	csv_to_export += total_power.toFixed(1) + "," + d.inst_power.toFixed(2) + ",";

	//----------  DISPLAY SPEED and SPLIT --------------------//
	
	let split_in_microsec = 500e6 / d.velocity; 
	split_value.text(format_time(split_in_microsec));

	let km_hr = (d.velocity * 3.6).toFixed(1); // m/s --> km/hr
	speed_value.text(km_hr); 

	speed_dial_arc.endAngle(dial_scale(km_hr));
	speed_dial.attr("d", speed_dial_arc);
	//speed_dial.style("color", speed_color);

	csv_to_export += km_hr + ",";

	//----------- DISPLAY DISTANCE -------------------------//

	let dt = d.timestamp - prev_timestamp; 
	prev_timestamp = d.timestamp;
	total_dist += d.inst_vel * dt * 1e-6;

	distance_value.text(total_dist.toFixed(0));
	csv_to_export += total_dist.toFixed(1) + "," + d.tick_duration + "\n";
}; // end of processing of one message

//----------------- HELPER FUNCTIONS -----------------------//

function generate_pie_data(kph) {
	let colors = [];

	// if we're not moving, just return an array of blacks
	if (kph <= 0) {
		for (i = 0; i < 20; i++) {
			colors[i] = {color: "#000", value: 1};
		}
		return colors;
	}

	// put the colors into the array
	for (i = 0; i < 20; i++) {
		if (kph <= i) {
			colors[i] = {color: "#000", value: 1};
		} else if (i < 5) {
			colors[i] = {color: speed_colors[0], value: 1};	
		} else if (i >= 5 && i < 10) {
			colors[i] = {color: speed_colors[1], value: 1};
		} else if (i >= 10 && i < 15) {
			colors[i] = {color: speed_colors[2], value: 1};
		} else if (i >= 15 && i < 20) {
			colors[i] = {color: speed_colors[3], value: 1};	
		}
	} 
	return colors;
}

function download_csv() {
	if (csv_to_export == "") return;

	if (!csv_to_export.match(/^data:text\/csv/i)) {
		csv_to_export = 'data:text/csv;charset=utf-8,' + csv_to_export;
	}
	let data = encodeURI(csv_to_export);

	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', 'workout_data.csv');
	link.click();
}

// microseconds --> 00:00 format
function format_time(microsec) {
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
	
	return display_min + ":" + display_sec;
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
