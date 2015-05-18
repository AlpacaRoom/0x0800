/*global Tile, Board, HTMLScreen, KeyboardManager */
var Game = (function () {
    "use strict";
    function Game(options) {
        this.radius = options.radius || 3;
        this.size = options.size || 500;
        this.speed = options.speed || 200;
        this.startTiles = options.startTiles || this.radius + 1;
        this.initialize();

        // Reset the game when we click the button
        this.keyboardManager.on("reset", this.initialize.bind(this));

        // Rotate when we hit the up or down arrows
        this.keyboardManager.on("move", this.moveBoard.bind(this));
    }

    /**
     * Sets up defaults / resets score / etc
     */
    Game.prototype.initialize = function () {
        var i;

        this.board = new Board(this.radius, Game.tileTypes.blank);
        this.keyboardManager = new KeyboardManager();
        this.screen = new HTMLScreen({
            size: this.size,
            speed: this.speed,
            board: this.board,
            minColor: "#ffff00",
            maxColor: "#ff0000"
        });

        this.score = 0;

        // Place startTiles number tiles on the board to get started
        for (i = 0; i < this.startTiles; i++) {
            this.board.placeRandom(Game.tileTypes.number);
        }

        this.screen.draw();
    };

    /**
     * Responds to keypresses. 
     * Up/down rotate the board counterclockwise/clockwise
     * Left/right shift the cells left/right (and merge)
     */
    Game.prototype.moveBoard = function (e) {
        var cellsToAdd = 0.75,  // Add a new cell 37.5% of the time by default (0.5 * 0.75)
            i,
            retVal;

        if (e >= 0 && e <= 3) {
            switch (e) {
            case 0:
                retVal = this.board.rotate(-1);
                break;
            case 2:
                retVal = this.board.rotate(1);
                break;
            case 1:
                retVal = Math.min(1, this.board.shift(1));
                break;
            case 3:
                retVal = Math.min(1, this.board.shift(-1));
                break;
            }

            cellsToAdd += retVal;

            // Add our extra cells
            cellsToAdd = Math.round(Math.random() * cellsToAdd);
            for (i = 0; i < cellsToAdd; i++) {
                this.board.placeRandom(Game.tileTypes.number);
            }

            if (this.board.isLost()) {
                window.alert("You lose!");
                this.initialize();
            } else {
                this.screen.draw();
            }
        }
    };

    /**
     * A static list of available tile types
     */
    Game.tileTypes = {
        player: {
            class: "player"
        },

        blank: {
            class: "hex",
            isBlank: true
        },

        number: {
            class: "number",
            isNumber: true
        },

        // When the bomb encounters another tile, it destroys all of its neighbors
        bomb: {
            class: "special",
            isSpecial: true,
            action: function (tile) {
                return new Tile(tile.pos, Game.tileTypes.blank);
            }
        }
    };

    return Game;
}());