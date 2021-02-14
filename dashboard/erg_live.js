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
 * total distance                   |        |  total time
 *      ::: 5 :::                     ::2::          ::: 5 :::
 *
 */

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

speedometer
	.append("text")
		.style("fill", "#0ff")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", speedometer_height/2)
		.attr("text-anchor", "middle")
		.text("speedometer goes here");

let distance_meter = dashboard.append("svg")
	.attr("x", 0)
	.attr("y", speedometer_height);

distance_meter
	.append("text")
		.style("fill", "#8af")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("distance goes here");

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

power_meter
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

time_meter
	.append("text")
		.style("fill", "#fff")
		.style("font", "25px monospace")
		.attr("x", meter_width/2)
		.attr("y", meter_height/2)
		.attr("text-anchor", "middle")
		.text("time goes here");

function responsive_resize(svg) {
	// find the aspect ratio of the area being resized
	console.log("in responsive_resive");
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
