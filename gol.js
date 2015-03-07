// Fix the Javascript modulo bug for negative numbers:
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) { return ((this%n)+n)%n; }

function genGrid(width, height) {
		var grid = [];
		for (i = 0; i < width; i++) {
				grid[i] = [];
				for (j = 0; j < height; j++) {
						grid[i][j] = 0;
				}
		}
		return grid;
}

function flipCoin() {
		return Math.random() < 0.5 ? 0 : 1;
}

function randomizeGrid(grid) {
		for (col = 0; col < grid.length; col++) {
				for (row = 0; row < grid[col].length; row++) {
						grid[col][row] = flipCoin();
				}
		}
}

function drawGrid(grid, canvas, ctx) {
		ctx.clearRect(0 , 0, canvas.width, canvas.height);

		var blockWidth = canvas.width / grid.length;
		var blockHeight = canvas.height / grid[0].length;

		for (col = 0; col < grid.length; col++) {
				for (row = 0; row < grid[col].length; row++) {
						if (grid[col][row] == 1) {
								ctx.fillRect(col*blockWidth, row*blockHeight, blockWidth-1, blockHeight-1);
						}
				}
		}
}

function updateGrid(grid) {
		var nextGrid = genGrid(grid.length, grid.length);

		for (var col = 0; col < grid.length; col++) {
				for (var row = 0; row < grid[col].length; row++) {
						var neighbors = [];
						
						for (var rel_col = -1; rel_col <= 1; rel_col++) {
								for (var rel_row = -1; rel_row <= 1; rel_row++) {
										if (rel_col == 0 && rel_row == 0) {
												continue; // Don't count yourself
										}
										var neighbor_col = (col+rel_col).mod(grid.length);
										var neighbor_row = (row+rel_row).mod(grid.length);
										neighbors.push(grid[neighbor_col][neighbor_row]);
								}
						}

						// Copy previos value
						nextGrid[col][row] = grid[col][row];
					
						// Determine whether this cell should be alive or dead in the next generation
						var total = neighbors.reduce(function(a, b) {
								return a + b;
						});

						if (nextGrid[col][row] == 1) { // if the cell is alive
								switch(total) {
								case 0:
								case 1:
										nextGrid[col][row] = 0; // underpopulation
										break;
								case 2:
								case 3:
										nextGrid[col][row] = 1; // stay alive
										break;
								default:
										nextGrid[col][row] = 0; // overcrowding
										break;
								}
						} else { // if the cell is dead
								if (total == 3) {
										nextGrid[col][row] = 1; // reproduction
								}
						}
				}
		}

		return nextGrid;
}

$(function () {
		var canvas = document.getElementById('world');
		canvas.width = 500;
		canvas.height = 500;
		// canvas.width = document.body.clientWidth;
		// canvas.height = document.body.clientHeight;
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = "rgba(90, 90, 90, 1.0)"

		// test grid fns
		var grid = genGrid(32, 32);
		randomizeGrid(grid);
		drawGrid(grid, canvas, ctx);

		setInterval(function updateAndDrawGrid() {
				grid = updateGrid(grid);
				drawGrid(grid, canvas, ctx);
		}, 100);
});
