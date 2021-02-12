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

// 2048 x 1536 (iPad size?)

const canvas_width = 2048; // (170) 853 | 342 | 853
const canvas_height = 1536; // (102) 1125/411 | 1536 | 714/411/411
const speedometer_height = Math.round(canvas_height * 11 / 15);
const meter_width = Math.round(canvas_width * 5 / 12);
const meter_height = Math.round(canvas_height * 4 / 15);
const power_bar_width = Math.round(canvas_width * 2 /12);
const p_curve_height = Math.round(canvas_height * 7 / 12);

let dashboard = d3.select("#dashboard").append("svg")
	.attr("width", canvas_width)
	.attr("height", canvas_height)
	.call(responsive_resize);

let speedometer = dashboard.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", meter_width)
	.attr("height", speedometer_height)
	.attr("fill", "cyan");

let distance_meter = dashboard.append("rect")
	.attr("x", 0)
	.attr("y", speedometer_height)
	.attr("width", meter_width)
	.attr("height", meter_height)
	.attr("fill", "blue");

let power_bar = dashboard.append("rect")
	.attr("x", meter_width)
	.attr("y", 0)
	.attr("width", power_bar_width)
	.attr("height", canvas_height)
	.attr("fill", "orange");

let power_curve = dashboard.append("rect")
	.attr("x", meter_width + power_bar_width)
	.attr("y", 0)
	.attr("width", meter_width)
	.attr("height", p_curve_height)
	.attr("fill", "pink");
	
let power_meter = dashboard.append("rect")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height)
	.attr("width", meter_width)
	.attr("height", meter_height)
	.attr("fill", "red");

let time_meter = dashboard.append("rect")
	.attr("x", meter_width + power_bar_width)
	.attr("y", p_curve_height + meter_height)
	.attr("width", meter_width)
	.attr("height", meter_height)
	.attr("fill", "white");
	
function responsive_resize(svg) {
	// find the aspect ratio of the area being resized
	const container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style("width"), 10),
		height = parseInt(svg.style("height"), 10),
		aspect = width / height;

	svg
		.attr("viewBox",`0 0 ${width} ${height}`)
		.attr("preserveAspectRatio", "xMinYMid")
		.call(resize);
		
		d3.select(window).on("resize." + container.attr("id"), resize);

		function resize() {
			const target_width = parseInt(container.style("width"))
			svg
				.attr("width", target_width)
				.attr("height", Math.round(target_width / aspect));
		}
}
