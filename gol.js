// Fix the Javascript modulo bug for negative numbers:
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) { return ((this%n)+n)%n; };

var DEAD = 0;
var ALIVE = 1;

function Cell() {
    this.state = DEAD;
    this.generation = -1;
}

Cell.prototype.getFillStyle = function(fadeWithAge) {
    if (fadeWithAge) {
        // Compute fill style based on the number of generations this cell has been alive
        var minColor = 80;
        var maxColor = 180;
        var colorStep = 25;
        var cellColor = Math.max(minColor, maxColor - this.generation * colorStep);
        return `rgba(${cellColor}, ${cellColor}, ${cellColor}, 1.0)`;
    } else {
        return "rgba(180, 180, 180, 1.0)";
    }
}

function Grid(width, height, cellSize, fadeWithAge) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.fadeWithAge = fadeWithAge;
    this.highlighted = null;

    this.space = new Array(width * height);
    this.clear();
}

Grid.prototype.clear = function() {
    for (var i = 0; i < this.space.length; i++) {
        this.space[i] = new Cell();
    }
};

function flipCoin() {
    // TODO Math.random is crap, consider using window.crypto.getRandomValues
    return Math.random() < 0.5 ? 0 : 1;
}

Grid.prototype.randomize = function() {
    for (var i = 0; i < this.space.length; i++) {
        this.space[i].state = flipCoin();
    }
};

Grid.prototype.get = function(x, y) {
    return this.space[x * this.width + y];
};

Grid.prototype.set = function(x, y, cell) {
    // Deep copy to avoid madness
    newCell = new Cell();
    newCell.state = cell.state;
    newCell.generation = cell.generation;
    this.space[x * this.width + y] = newCell;
}

Grid.prototype.setState = function(x, y, state) {
    var cell = this.space[x * this.width + y];

    // Update the generation count
    if (state == ALIVE) {
        cell.generation += 1;
    } else {
        cell.generation = -1;
    }

    cell.state = state;
};

Grid.prototype.getHighlighted = function() {
    return this.highlighted;
}

Grid.prototype.setHighlighted = function(cell) {
    this.highlighted = cell;
}

Grid.prototype.draw = function(canvas) {
    var ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0 , 0, canvas.width, canvas.height);

    for (var row = 0; row < this.height; row++) {
        for (var col = 0; col < this.width; col++) {
            var cell = this.get(row, col);

            if (cell.state === ALIVE) {
                ctx.fillStyle = cell.getFillStyle(this.fadeWithAge);
                ctx.fillRect(row*this.cellSize, col*this.cellSize,
                             this.cellSize - 1, this.cellSize - 1);
            }

            if (this.highlighted !== null && cell == this.highlighted) {
                ctx.fillStyle = "rgba(180, 180, 180, 1.0)";
                ctx.fillRect(row*this.cellSize, col*this.cellSize,
                             this.cellSize - 1, this.cellSize - 1);
            }
        }
    }
};

Grid.prototype.update = function() {
    var updated = new Grid(this.width, this.height,
                           this.cellSize, this.fadeWithAge);

    for (var row = 0; row < this.height; row++) {
        for (var col = 0; col < this.width; col++) {
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

            var numLiveNeighbors = 0;
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i].state === ALIVE) {
                    numLiveNeighbors += 1;
                }
            }

            // Update cells with the rules of life
            if (this.get(row, col).state == ALIVE) {
                switch(numLiveNeighbors) {
                case 0:
                case 1:
                    updated.setState(row, col, DEAD); // underpopulation
                    break;
                case 2:
                case 3:
                    updated.setState(row, col, ALIVE); // stay alive
                    break;
                default:
                    updated.setState(row, col, DEAD); // overcrowding
                    break;
                }
            } else {
                if (numLiveNeighbors == 3) {
                    updated.setState(row, col, ALIVE); // reproduction
                }
            }
        }
    }

    // Swap current space with updated space
    this.space = updated.space;
};

$(function () {
    var canvas = document.getElementById('world');
    canvas.width = $(window).width();
    canvas.height = $(window).height() - $('header').height();

    var cellSize = 15; // px
    var gridWidth = Math.floor(canvas.height / cellSize)
    var gridHeight = Math.floor(canvas.width / cellSize)
    var fadeWithAge = $("#fade-with-age").prop('checked');

    var grid = new Grid(gridWidth, gridHeight, cellSize, fadeWithAge);
    grid.randomize();
    grid.draw(canvas);

    var running = false;
    var simulationIntervalId = 0;

    $('#fade-with-age').click(function toggleFadeWithAge() {
        fadeWithAge = $("#fade-with-age").prop('checked');
        grid.fadeWithAge = fadeWithAge;
    });

    function toggleStartStop() {
        if (running === false) {
            running = true;

            // Update UI
            $('#startstop').html('Stop');
            $('#clear').prop('disabled', true);
            $('#random').prop('disabled', true);

            // Clear the highlighted cell for the simulation
            grid.setHighlighted(null);

            // Start simulation
            simulationIntervalId = setInterval(function updateAndDrawGrid() {
                grid.update();
                grid.draw(canvas);
            }, 100);
        } else {
            running = false;

            $('#startstop').html('Start');
            $('#clear').prop('disabled', false);
            $('#random').prop('disabled', false);

            clearInterval(simulationIntervalId);
        }
    }

    $('#startstop').click(function () {
        toggleStartStop();
    });

    $('#world').click(function drawInCanvas(event) {
        if (running === true) {
            return; // Don't allow drawing while simulation is running
        }

        var x = event.pageX - canvas.offsetLeft,
            y = event.pageY - canvas.offsetTop;

        // TODO collision detection
        var row = Math.floor(x / cellSize),
            col = Math.floor(y / cellSize);

        console.log("x: %d, y: %d, row: %d, col: %d", x, y, row, col);

        var currentVal = grid.get(row, col);
        grid.setState(row, col, currentVal.state == 0 ? 1 : 0);
        grid.draw(canvas);
    });

    $('#world').mousemove(function highlightCell(e) {
        if (running === true) {
            return; // Don't highlight cells while the simulation is running
        }

        var x = event.pageX - canvas.offsetLeft,
            y = event.pageY - canvas.offsetTop;

        // TODO collision detection
        var row = Math.floor(x / cellSize),
            col = Math.floor(y / cellSize);

        var currentCell = grid.get(row, col);
        // Avoid unnecessary redraws: only redraw the grid when the current
        // highlighted cell changes.
        if (currentCell !== grid.getHighlighted()) {
            grid.setHighlighted(currentCell);
            grid.draw(canvas);
        }
    });

    $('#world').mousedown(function preventTextSelection(e) {
        // Prevent annoying selection of text in the header when clicking around
        // in the canvas.
        e.preventDefault();
    });


    function toggleKeyboardShortcutsHelp() {
        $('div#keyboard-shortcuts-help').toggle();
    }

    // Keyboard shortcuts
    $(document).keypress(function(e) {
        var key = e.which;
        switch(key) {
        case 's'.charCodeAt():
            toggleStartStop();
            break;
        case 'c'.charCodeAt():
            clear();
            break;
        case 'r'.charCodeAt():
            randomize();
            break;
        case '?'.charCodeAt():
            toggleKeyboardShortcutsHelp();
        default:
            break;
        }
    });

    function clear() {
        // Don't clear if the simulation is running
        if (running === true) {
            return;
        }

        grid.clear();
        grid.draw(canvas);
    }

    $('#clear').click(function () {
        clear();
    });

    function randomize() {
        // Don't randomize if the simulation is running
        if (running === true) {
            return;
        }

        grid.clear();
        grid.randomize();
        grid.draw(canvas);
    }

    $('#random').click(function() {
        randomize();
    });

    $('#world').mouseenter(function () {
        if (running === false) {
            $('canvas#world').css('cursor', 'pointer');
        } else {
            $('canvas#world').css('cursor', 'default');
        }
    })

    $('#world').mouseleave(function () {
        // Clear the highlighted cell when the mouse leaves the canvas;
        // otherwise it looks like you accidentally placed a cell that isn't
        // really alive.
        grid.setHighlighted(null);
        grid.draw(canvas);
    })

});
