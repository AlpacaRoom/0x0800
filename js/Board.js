/*global HexGrid, Vector, Tile, Game */
var Board = (function () {
    "use strict";
    /**
     * Initializes a grid of size radius and sets initial values
     * in the hexes.
     *
     */
    function Board(radius, tileValue) {
        this.score = 0;
        this.radius = radius;

        // Create the grid and fill it with the initial tile
        this.grid = new HexGrid(radius);
        if (tileValue) {
            this.grid.initialize(tileValue);    
        }

        /**
         * In order to check for a loss, we need to
         * rotate the board enough times so every ring
         * is in the same position as when we started,
         * verifying along the way that there are no
         * possible merges to be made.
         *
         * To do this, we compute the LCM of the length
         * of the rings.
         *
         * Each ring of hexagons of radius r
         * contains 6r hexagons.
         */
        this.lossRotations = Math.lcm_list(
            Array.apply(null, Array(this.radius))
                .map(function(a, i) {
                    return (i + 1) * 6;
                })
        );
    }

    /**
     * Puts a tile into a random available space
     */
    Board.prototype.placeRandom = function (value) {
        var spaces = this.grid.availableSpaces(),
            index = Math.floor(Math.random() * spaces.length);

        if (spaces.length === 0) {
            return false;
        }

        return this.place(spaces[index].pos, value);
    };

    /**
     * Puts a tile onto the board at a given position
     */
    Board.prototype.place = function (pos, value) {
        var tile;

        if (value.isNumber) {
            value.value = Math.random() < 0.9 ? 2 : 4;
        }

        tile = new Tile(pos, value);
        tile.origPos = this.grid.get(pos).origPos;
        return this.grid.set(tile.pos, tile);
    };

    /**
     * Shifts the whole board left (-1) or right (1)
     */
    Board.prototype.shift = function (dir) {
        var mergedTiles = 0,
            vector = new Vector(dir, 0),
            x,
            y,
            xMin,
            xMax,
            pos,
            tile,
            abort,
            currentPos;

        // If there are no open spaces, shifting won't do anything.
        if (this.grid.availableSpaces().length === 0) {
            return -1;
        }
        // Iterate from top to bottom, and right-to-left (1) or left-to-right (-1)
        for (y = -this.radius; y <= this.radius; y++) {
            xMin = dir > 0 ? this.grid.xMax(y) : this.grid.xMin(y);
            xMax = dir > 0 ? this.grid.xMin(y) : this.grid.xMax(y);
            x = xMin;
            while (x !== xMax + (-dir)) {
                pos = new Vector(x, y);
                tile = this.grid.get(pos);
                // If we grabbed a non-blank tile, shift it in the desired direction until we can't shift it any more
                if (!tile.isBlank) {
                    abort = false;
                    currentPos = pos;
                    while (!abort) {
                        tile = this.grid.get(currentPos);
                        switch (this.move(tile, vector)) {
                        case -1:
                            // We've reached an invalid move, so we break out of the current loop
                            abort = true;
                            break;
                        case 1:
                            mergedTiles++;
                            break;
                        }
                        currentPos = Vector.add(currentPos, vector);
                    }
                }
                // Move across the row
                x += (-dir);
            }
        }

        return mergedTiles;
    };

    /**
     * Rotates the whole grid one space counter-clockwise (-1) or clockwise (1)
     */
    Board.prototype.rotate = function (dir) {
        var i,
            j,
            ring,   // The ring of cells at the specified radius
            first,  // The first cell in the ring
            temp;   // For swapping

        for (i = 1; i <= this.radius; i++) {
            ring = this.grid.ring(i);

            // If we're going counter-clockwise, we need to reverse the ring.
            if (dir === -1) {
                ring = ring.reverse();
            }

            // Make a new tile with the last tile in the ring's position 
            // and the first tile's value
            first = new Tile(ring[ring.length - 1].pos, ring[0]);

            // Move each tile back a spot in the ring
            for (j = 1; j < ring.length; j++) {
                temp = new Tile(ring[j - 1].pos, ring[j]);
                this.grid.set(temp.pos, temp);
            }

            // Move the first tile into the last slot
            this.grid.set(first.pos, first);
        }
        // We return 0 so we have a return value to use in the Game's move function
        return 0;
    };

    /**
     * Translates a given tile by a given vector and replaces
     * it with a blank tile.
     *
     * If the tile encounters a matching tile, the two
     * are merged.
     *
     * Returns -1 if the move could not be completed,
     * 0 if the tile was moved,
     * and 1 if the tile was merged.
     */
    Board.prototype.move = function (tile, vector) {
        var pos = tile.pos,
            newPos = Vector.add(pos, vector),
            oldTile = this.grid.get(newPos),
            newTile;

        // If there's nothing in the space, it's not valid
        if (!oldTile) {
            return -1;
        }

        // Move the tile into the blank spot
        if (oldTile && oldTile.isBlank) {
            newTile = new Tile(newPos, tile);
            this.grid.set(newPos, newTile);

            // A tile to replace oldTile (so we inherit its origPos)
            newTile = new Tile(pos, Game.tileTypes.blank);
            newTile.origPos = oldTile.origPos;
            this.grid.set(pos, newTile);
            return 0;
        }

        if (oldTile && !oldTile.isBlank && tile.isSpecial && tile.hasOwnProperty("action")) {
            // TODO: Special tile
        }

        // Merge the tiles if they hold the same value
        if (oldTile && tile.value && oldTile.value && oldTile.value === tile.value) {
            this.score += oldTile.value * 100;
            oldTile.value <<= 1;

            // Since we're replacing oldTile with tile, we inherit oldTile.origPos
            newTile = new Tile(pos, Game.tileTypes.blank);
            newTile.origPos = tile.origPos;
            this.grid.set(pos, newTile);
            return 1;
        }
    };

    /**
     * Returns an array containing all the hexagons on the board.
     */
    Board.prototype.cellData = function () {
        return this.grid.array();
    };

    /**
     * Returns true if there are no more open spaces left.
     */
    Board.prototype.isFull = function () {
        return this.grid.availableSpaces().length === 0;
    };

    Board.prototype.hasMove = function () {
        var x,
            y,
            xMin,
            xMax,
            tile,
            neighbors,
            pos;

        // Iterate over the board, checking if our x + 1 and x - 1 neighbors have the same value
        for (y = -this.radius; y <= this.radius; y++) {
            xMin = this.grid.xMin(y);
            xMax = this.grid.xMax(y);
            // We could compare fewer hexes (skipping edges, etc.), but ...
            for (x = xMin; x < xMax; x++) {
                pos = new Vector(x, y);
                tile = this.grid.get(pos);
                // If we're not a number tile, skip this tile
                if (!tile.value) {
                    continue;
                }
                neighbors = this.grid.neighbors(pos);
                // We're interested in neighbors 0 (1, 0) and 3 (-1, 0)
                if (neighbors[0] && neighbors[0].value && neighbors[0].value == tile.value) {
                    return true;
                }
                if (neighbors[3] && neighbors[3].value && neighbors[3].value == tile.value) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Checks for the loss condition.
     * Returns true if there are no more moves to make.
     */
    Board.prototype.isLost = function () {
        var b = new Board(this.radius),
            i;

        if (!this.isFull()) {
            return false;
        }

        b.grid.copy(this.grid);

        if (this.hasMove()) {
            return false;
        }

        for (i = 0; i < this.lossRotations; i++) {
            b.rotate(1);
            if (b.hasMove()) {
                return false;
            }
        }

        return true;
    };

    return Board;
}());