/// <reference path="cie-1931-d65.js" />
/// <reference path="cie-1931-xyz.js" />
/// <reference path="color.js" />

// Vertex shader program

var VERTEX_SHADER =
	'uniform mat4 u_MvpMatrix;                          \n' +
	'attribute vec4 a_Position;                         \n' +
	'attribute vec4 a_Color;                            \n' +
	'varying vec4 v_Color;                              \n' +
	'void main()                                        \n' +
	'{                                                  \n' +
	'   gl_Position = u_MvpMatrix * a_Position;         \n' +
	'   gl_PointSize = 1.0;                             \n' +
	'   v_Color = a_Color;                              \n' +
	'}                                                  \n';

// Fragment shader program

var FRAGMENT_SHADER =
	'#ifdef GL_ES                                       \n' +
	'precision mediump float;                           \n' +
	'#endif                                             \n' +
	'varying vec4 v_Color;                              \n' +
	'void main()                                        \n' +
	'{                                                  \n' +
	'   gl_FragColor = v_Color;                         \n' +
	'}                                                  \n';

// JavaScript source code

var camera_position = [2.5, 2.5, 2.5];

function main() {
	
    generate_all();

    document.getElementById("x_input").value = camera_position[0];
    document.getElementById("y_input").value = camera_position[1];
    document.getElementById("z_input").value = camera_position[2];

    initialize('canvas', camera_position, g_ciexyz_points, g_srgb_colors);
}

function selectChanged() {

    var index = document.getElementById("select").selectedIndex;

    switch (index) {
        default:
        case 0:
            initialize('canvas', camera_position, g_ciexyz_points, g_srgb_colors);
            break;
        case 1:
            initialize('canvas', camera_position, g_ciergb_points, g_srgb_colors);
            break;
        case 2:
            initialize('canvas', camera_position, g_srgb_points, g_srgb_colors);
            break;
    }
}

function buttonClicked() {

    camera_position[0] = document.getElementById("x_input").value;
    camera_position[1] = document.getElementById("y_input").value;
    camera_position[2] = document.getElementById("z_input").value;

    selectChanged();
}

function initialize(canvas_id, camera_position, vertex_data, color_data) {

	// Retrieve <canvas> element
	var canvas = document.getElementById(canvas_id);

	if (!canvas) {
		console.log('Failed to retrieve the <canvas> element.');
		return;
	}

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);

	if (!gl) {
		console.log('Failed to get the rendering context for WebGL.');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
		console.log('Failed to initialize shaders.');
		return;
	}

	// Enable hidden surface removal
	gl.enable(gl.DEPTH_TEST);

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Set the eye point and the viewing volume
	var viewProjectionMatrix = new Matrix4();
	viewProjectionMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 1000.0);
	viewProjectionMatrix.lookAt(camera_position[0], camera_position[1], camera_position[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

	// Get the storage location of u_MvpMatrix
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

	if (!u_MvpMatrix) {
		console.log('Failed to get the storage location of u_MvpMatrix');
		return;
	}

	var currentAngle = [0.0, 0.0, 0.0];
	initEventHandlers(canvas, currentAngle);

	var colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_data), gl.STATIC_DRAW);

	// Get the storage location of a_Color variable
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return;
	}

	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Color);

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);

	// Get the storage location of a_Position variable
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}

	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);

	var tick = function () {
		draw(gl, viewProjectionMatrix, u_MvpMatrix, currentAngle);
		requestAnimationFrame(tick, canvas);
	}

	tick();
}

function initEventHandlers(canvas, currentAngle) {

	var dragging = false;         // Dragging or not
	var lastX = -1, lastY = -1;   // Last position of the mouse

	canvas.onmousedown = function (ev) {   // Mouse is pressed
		var x = ev.clientX, y = ev.clientY;
		// Start dragging if a moue is in <canvas>
		var rect = ev.target.getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			lastX = x; lastY = y;
			dragging = true;
		}
	};

	canvas.onmouseup = function (ev) {
		dragging = false;
	}; // Mouse is released

	canvas.onmousemove = function (ev) { // Mouse is moved
		var x = ev.clientX, y = ev.clientY;
		if (dragging) {
			var factor = 100 / canvas.height; // The rotation ratio
			var dx = factor * (x - lastX);
			var dy = factor * (y - lastY);
			// Limit x-axis rotation angle to -90 to 90 degrees
			currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
			currentAngle[1] = currentAngle[1] + dx;
		}
		lastX = x, lastY = y;
	};
}

var LAMBDA_MIN = 380;
var LAMBDA_MAX = 780;

var WIDTH_MAX = LAMBDA_MAX - LAMBDA_MIN;

var g_num_points = 0;
var g_ciexyz_points = [];
var g_ciergb_points = [];
var g_srgb_points = [];
var g_srgb_colors = [];

function generate_all() {

	for (var lambda = LAMBDA_MIN; lambda <= LAMBDA_MAX ; lambda++) {

		for (var width = 1; width <= WIDTH_MAX; width++) {

			generate_data(generate_spectrum(0.0, 1.0, lambda, width));
		}
	}
}

function generate_spectrum(low, high, lambda, width) {

	var spectrum = [];

	if (lambda + width > LAMBDA_MAX) {

		for (var i = LAMBDA_MIN; i <= LAMBDA_MAX ; i++) {

			spectrum[i] = low;

			if (i >= lambda || i < (lambda + width) - LAMBDA_MAX - 1 + LAMBDA_MIN) {

				spectrum[i] = high;
			}
		}
	}
	else {

		for (var i = LAMBDA_MIN; i <= LAMBDA_MAX ; i++) {

			spectrum[i] = low;

			if (i >= lambda && i < lambda + width) {

				spectrum[i] = high;
			}
		}
	}

	return spectrum;
}

function generate_data(spectrum)
{
	var white = 0;
	var spd_xyz = [0.0, 0.0, 0.0];

	for (var lambda = LAMBDA_MIN; lambda <= LAMBDA_MAX; lambda++) {

		var cie_d65 = g_cie_1931_d65[lambda];
		var cie_xyz = g_cie_1931_xyz[lambda];
		var spectrum_value = spectrum[lambda];

		spd_xyz[0] = spd_xyz[0] + (spectrum_value * cie_xyz[0] * cie_d65);
		spd_xyz[1] = spd_xyz[1] + (spectrum_value * cie_xyz[1] * cie_d65);
		spd_xyz[2] = spd_xyz[2] + (spectrum_value * cie_xyz[2] * cie_d65);

		white = white + (cie_xyz[1] * cie_d65);
	}

	spd_xyz[0] = spd_xyz[0] / white;
	spd_xyz[1] = spd_xyz[1] / white;
	spd_xyz[2] = spd_xyz[2] / white;

	g_ciexyz_points.push(spd_xyz[0]);
	g_ciexyz_points.push(spd_xyz[1]);
	g_ciexyz_points.push(spd_xyz[2]);

	var cie_rgb = ciexyz2ciergb(spd_xyz);

	g_ciergb_points.push(cie_rgb[0]);
	g_ciergb_points.push(cie_rgb[1]);
	g_ciergb_points.push(cie_rgb[2]);

	var monitor_rgb = ciexyz2srgb(spd_xyz);

	g_srgb_points.push(monitor_rgb[0]);
	g_srgb_points.push(monitor_rgb[1]);
	g_srgb_points.push(monitor_rgb[2]);

	monitor_rgb[0] = Math.min(monitor_rgb[0], 1.0);
	monitor_rgb[1] = Math.min(monitor_rgb[1], 1.0);
	monitor_rgb[2] = Math.min(monitor_rgb[2], 1.0);

	white = (monitor_rgb[0] > 0) ? 0 : monitor_rgb[0];
	white = (white < monitor_rgb[1]) ? white : monitor_rgb[1];
	white = (white < monitor_rgb[2]) ? white : monitor_rgb[2];
	white = -white;

	if (white > 0) {
		monitor_rgb[0] = monitor_rgb[0] + white;
		monitor_rgb[1] = monitor_rgb[1] + white;
		monitor_rgb[2] = monitor_rgb[2] + white;

		monitor_rgb[0] = Math.min(monitor_rgb[0], 1.0);
		monitor_rgb[1] = Math.min(monitor_rgb[1], 1.0);
		monitor_rgb[2] = Math.min(monitor_rgb[2], 1.0);
	}
	else {
		white = 0.0;
	}

	g_num_points = g_ciexyz_points.length / 3;

	g_srgb_colors.push(monitor_rgb[0]);
	g_srgb_colors.push(monitor_rgb[1]);
	g_srgb_colors.push(monitor_rgb[2]);
}

var g_MvpMatrix = new Matrix4();
function draw(gl, viewProjectionMatrix, u_MvpMatrix, currentAngle) {
	g_MvpMatrix.set(viewProjectionMatrix);

	g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0);
	g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0);
	g_MvpMatrix.rotate(currentAngle[2], 0.0, 0.0, 1.0);

	gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.POINTS, 0, g_num_points);
}