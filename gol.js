// Fix the Javascript modulo bug for negative numbers:
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) { return ((this%n)+n)%n; };

var DEAD = 0;
var ALIVE = 1;

function Cell(x, y) {
		this.x = x;
		this.y = y;
}

function Grid(width, height) {
		this.width = width;
		this.height = height;
		this.space = new Array(width * height);
		this.clear();
}

Grid.prototype.clear = function() {
		for (var i = 0; i < this.space.length; i++) {
				this.space[i] = DEAD;
		}
};

function flipCoin() {
		return Math.random() < 0.5 ? 0 : 1;
}

Grid.prototype.randomize = function() {
		for (var i = 0; i < this.space.length; i++) {
				this.space[i] = flipCoin();
		}
};

Grid.prototype.get = function(x, y) {
		return this.space[x * this.width + y];
};

Grid.prototype.set = function(x, y, value) {
		this.space[x * this.width + y] = value;
};

Grid.prototype.draw = function(canvas) {
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = "rgba(90, 90, 90, 1.0)";

		// Clear the canvas
		ctx.clearRect(0 , 0, canvas.width, canvas.height);

		var blockWidth = canvas.width / this.width;
		var blockHeight = canvas.height / this.height;

		for (var row = 0; row < this.height; row++) {
				for (var col = 0; col < this.width; col++) {
						if (this.get(row, col) == ALIVE) {
								ctx.fillRect(row*blockHeight, col*blockWidth,
														 blockHeight - 1, blockWidth - 1);
						}
				}
		}
};

Grid.prototype.update = function() {
		var updated = new Grid(this.width, this.height);

		for (var row = 0; row < this.height; row++) {
				for (var col = 0; col < this.width; col++) {
						// Copy value from previous generation
						updated.set(row, col, this.get(row, col));

						// Count living neighbors
						var neighbors = [];

						for (var rel_row = -1; rel_row <= 1; rel_row++) {
								for (var rel_col = -1; rel_col <= 1; rel_col++) {
										if (rel_row == 0 && rel_col == 0) {
												continue; // Don't count yourself
										}
										var neighbor_row = (row+rel_row).mod(this.height);
										var neighbor_col = (col+rel_col).mod(this.width);
										neighbors.push(this.get(neighbor_row, neighbor_col));
								}
						}

						var numLiveNeighbors = neighbors.reduce(function(a, b) {
								return a + b;
						});

						// Update cells with the rules of life
						if (this.get(row, col) == ALIVE) {
								switch(numLiveNeighbors) {
								case 0:
								case 1:
										updated.set(row, col, DEAD); // underpopulation
										break;
								case 2:
								case 3:
										updated.set(row, col, ALIVE); // stay alive
										break;
								default:
										updated.set(row, col, DEAD); // overcrowding
										break;
								}
						} else {
								if (numLiveNeighbors == 3) {
										updated.set(row, col, ALIVE); // reproduction
								}
						}
				}
		}

		// Swap current space with updated space
		this.space = updated.space;
};

$(function () {
		var canvas = document.getElementById('world');
		canvas.width = 500;
		canvas.height = 500;
		// canvas.width = document.body.clientWidth;
		// canvas.height = document.body.clientHeight;
	    
		var grid = new Grid(32, 32);
		grid.randomize();
		grid.draw(canvas);

		var running = false;
		var simulationIntervalId = 0;

		$('#startstop').click(function startStopButton() {
				if (running === false) {
						running = true;

						// Update UI
						$(this).html('Stop');
						$('#clear').prop('disabled', true);
						$('#random').prop('disabled', true);

						// Start simulation
						simulationIntervalId = setInterval(function updateAndDrawGrid() {
								grid.update();
								grid.draw(canvas);
						}, 100);
				} else {
						running = false;

						$(this).html('Start');
						$('#clear').prop('disabled', false);
						$('#random').prop('disabled', false);

						clearInterval(simulationIntervalId);
				}
		});

		// Default to the center of the grid
		var currentCell = new Cell(Math.floor(grid.width / 2),
															 Math.floor(grid.height / 2));
		
		$('#world').click(function drawInCanvas(event) {
				if (running === true) {
						return; // Don't allow drawing while simulation is running
				}

				var x = event.pageX - canvas.offsetLeft,
						y = event.pageY - canvas.offsetTop;

				var blockWidth = canvas.width / grid.width;
				var blockHeight = canvas.height / grid.height;

				// TODO collision detection
				var row = Math.floor(x / blockWidth),
						col = Math.floor(y / blockHeight);

				console.log("x: %d, y: %d, row: %d, col: %d", x, y, row, col);

				var currentVal = grid.get(row, col);
				currentCell = new Cell(row, col);
				grid.set(row, col, currentVal == 0 ? 1 : 0);
				grid.draw(canvas);
		});

		$(window).keydown(function(e) {
				var LEFT_ARROW = 37;
				var RIGHT_ARROW = 39;
				var UP_ARROW = 38;
				var DOWN_ARROW = 40;
				var SPACE = 32;

				var key = e.which;
				//console.log('keypress: %d', key);

				switch(key) {
				case LEFT_ARROW:
						currentCell.x = (currentCell.x - 1).mod(grid.width);
						break;
				case RIGHT_ARROW:
						currentCell.x = (currentCell.x + 1).mod(grid.width);
						break;
				case UP_ARROW:
						currentCell.y = (currentCell.y - 1).mod(grid.height);
						break;
				case DOWN_ARROW:
						currentCell.y = (currentCell.y + 1).mod(grid.height);
						break;
				case SPACE:
						grid.set(currentCell.x, currentCell.y,
										 grid.get(currentCell.x, currentCell.y) === 0 ? 1 : 0);
						grid.draw(canvas);
						break;
				default:
						break;
				}

				//console.log("currentCell: (%d, %d)", currentCell.x, currentCell.y);
		});

		$('#clear').click(function () {
				grid.clear();
				grid.draw(canvas);
		});

		$('#random').click(function() {
				grid.randomize();
				grid.draw(canvas);
		});

});
