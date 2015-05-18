/*global Vector */
var Tile = (function () {
    "use strict";
    function Tile(pos, value) {
        var self = this;

        // Copy the value's keys
        Object.keys(value).forEach(function (key) {
            self[key] = value[key];
        });

        // In case we get a tile with a pos, we overwrite it.
        this.pos = pos;
    }

    Tile.prototype.move = function (newPos) {
        this.pos = newPos;
    };

    return Tile;
}());