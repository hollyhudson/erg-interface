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

let dashboard = d3.select("#dashboard").append("svg")
	.attr("width", canvas_width)
	.attr("height", canvas_height);

let speedometer = dashboard.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", 853)
	.attr("height", 1125)
	.attr("fill", "cyan");

let distance_meter = dashboard.append("rect")
	.attr("x", 0)
	.attr("y", 1125)
	.attr("width", 853)
	.attr("height", 411)
	.attr("fill", "blue");

let power_bar = dashboard.append("rect")
	.attr("x", 853)
	.attr("y", 0)
	.attr("width", 342)
	.attr("height", canvas_height)
	.attr("fill", "orange");

let power_curve = dashboard.append("rect")
	.attr("x", 1195)
	.attr("y", 0)
	.attr("width", 853)
	.attr("height", 714)
	.attr("fill", "pink");
	
let power_meter = dashboard.append("rect")
	.attr("x", 1195)
	.attr("y", 714)
	.attr("width", 853)
	.attr("height", 411)
	.attr("fill", "red");

let time_meter = dashboard.append("rect")
	.attr("x", 1195)
	.attr("y", 1125)
	.attr("width", 853)
	.attr("height", 411)
	.attr("fill", "white");
	

