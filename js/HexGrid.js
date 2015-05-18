/*global Vector, Game, Tile */
var HexGrid = (function () {
    "use strict";
    /**
     * We produce a hexagonal grid of the given radius.
     *
     * We use a two-dimensional array to store the hexagon,
     * with the origin in the center of the grid. In a size-n
     * hexagon, we need a grid sized 2(n + 1) - 1.
     */
    function HexGrid(radius) {
        var i;

        this.grid = new Array((radius + 1) * 2 - 1);
        for (i = 0; i < this.grid.length; i++) {
            this.grid[i] = new Array(this.grid.length);
        }

        this.radius = radius;
    }

    /**
     * The locations of all of our neighbors.
     */
    HexGrid.prototype.dirs = [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [-1, 1],
        [0, 1]
    ];

    /**
     * Fills all the cells inside the grid with an object just containing
     * a Vector of its location in the pos property.
     */
    HexGrid.prototype.initialize = function (tileValue) {
        var x,
            y,
            pos,    // a Vector to hold our current x, y coordinates
            tile;   // The tile we are placing

        for (y = -this.radius; y <= this.radius; y++) {
            for (x = this.xMin(y); x <= this.xMax(y); x++) {
                pos = new Vector(x, y);
                tile = new Tile(pos, tileValue);
                tile.origPos = pos;
                this.set(pos, tile);
            }
        }
    };

    /**
     * Fills the grid from another grid (for copying)
     */
    HexGrid.prototype.copy = function (grid) {
        this.grid = grid.grid.slice(0);
    };

    /**
     * Takes a Vector and returns the contents of the specified hexagon.
     *
     * Returns false if the coordinates are invalid.
     *
     */
    HexGrid.prototype.get = function (pos) {
        var index = this.translate(pos);

        if (index === false) {
            return false;
        }

        return this.grid[index[0]][index[1]];
    };

    /**
     * Takes a Vector and sets the contents of the specified hexagon.
     *
     * Returns the value that was set, or false
     * if the coordinates are invalid.
     */
    HexGrid.prototype.set = function (pos, value) {
        var index = this.translate(pos);

        if (index === false) {
            return false;
        }
        this.grid[index[0]][index[1]] = value;
        return value;
    };

    /**
     * Returns an array of available spaces.
     */
    HexGrid.prototype.availableSpaces = function () {
        var spaces = this.array(),
            availableSpaces = [],
            i;

        for (i = 0; i < spaces.length; i++) {
            if (spaces[i].isBlank) {
                availableSpaces.push(spaces[i]);
            }
        }

        return availableSpaces;
    };

    /**
     * Returns the values of all the neighbors of a hexagon specified by a Vector.
     */
    HexGrid.prototype.neighbors = function (pos) {
        var dir,
            newPos,         // a Vector that holds the position of the current neighbor
            neighbor,       // The value of the current neighbor
            neighbors = [],
            i;

        // Make sure we're inside the grid
        if (!this.isValid(pos)) {
            return false;
        }

        for (i = 0; i < this.dirs.length; i++) {
            dir = this.dirs[i];
            newPos = Vector.add(pos, new Vector(dir[0], dir[1]));
            neighbor = this.get(newPos);
            neighbors.push(neighbor);
        }
        return neighbors;
    };

    /**
     * Returns all the hexes a given distance from the origin.
     * Used to rotate the grid.
     */
    HexGrid.prototype.ring = function (radius) {
        var result = [],
            current,    // The value of the cell in our current position
            i,
            j;

        if (radius > this.radius) {
            return false;
        }

        // We're going to start in direction 4 and go clockwise, since that's what our directions array does
        current = this.get(new Vector(-radius, radius));

        for (i = 0; i < 6; i++) {
            for (j = 0; j < radius; j++) {
                result.push(current);
                current = this.neighbors(current.pos)[i];
            }
        }
        return result;
    };

    /**
     * Returns all the cells as an array.
     */
    HexGrid.prototype.array = function () {
        var result = [],
            i,
            j;

        for (i = 0; i < this.grid.length; i++) {
            for (j = 0; j < this.grid[i].length; j++) {
                if (this.grid[i][j] !== undefined) {
                    result.push(this.grid[i][j]);
                }
            }
        }
        return result;
    };

    /**
     * Converts a Vector into an array containing the [r][q]
     * index of the specified hexagon.
     *
     * Returns false if the coordinates are invalid.
     */
    HexGrid.prototype.translate = function (pos) {
        if (Math.abs(pos.x) > this.radius || Math.abs(pos.y) > this.radius) {
            return false;
        }

        return [
            pos.y + this.radius,
            pos.x + this.radius
        ];
    };

    /**
     * Calculates the maximum x value for a given y column
     */
    HexGrid.prototype.xMax = function (y) {
        return this.radius - Math.max(0, y);
    };

     /**
     * Calculates the minimum x value for a given y column
     */
    HexGrid.prototype.xMin = function (y) {
        return -this.radius - Math.min(0, y);
    };

    /**
     * Uses translate() to determine if a given Vector is inside the map.
     */
    HexGrid.prototype.isValid = function (pos) {
        return this.translate(pos);
    };

    return HexGrid;
}());