/*global d3, Vector */
/**
 * Uses d3 to draw the grid into an SVG element.
 */
var HTMLScreen = (function () {
    "use strict";
    function HTMLScreen(options) {
        this.size = options.size;
        this.board = options.board;
        this.speed = options.speed;
        this.minColor = options.minColor;
        this.maxColor = options.maxColor;

        this.initialize();
    }

    HTMLScreen.prototype.initialize = function () {
        var i,
            rad,
            vertex;

        // Set up the size and positions of the hexagons
        this.center = new Vector(this.size / 2, this.size / 2);
        this.hexSize = ((this.size / (((this.board.radius + 1) * 2) - 1)) / 2);
        this.hexH = this.hexSize * 2;
        this.hexW = (Math.sqrt(3) / 2) * this.hexH;

        // Create the shape of the hexagon
        this.points = "";
        for (i = 0; i < 6; i++) {
            rad = Math.PI / 180 * ((60 * i) + 90);
            vertex = new Vector(
                ((this.hexSize) * Math.cos(rad)),
                ((this.hexSize) * Math.sin(rad))
            );
            this.points += vertex.x + ", " + vertex.y + " ";
        }

        // Draw the board for the first time
        // We do this here since we should never have to call .enter() again
        this.svg = d3.select("#gameBoard");

        // Pad the height to allow room for the score
        this.svg.attr("height", this.size + 32).attr("width", this.size);

        // In case we are resetting
        this.svg.selectAll("*").remove();

        // Draw the grid
        this.svg.selectAll("polygon").data(this.gridData())
            .enter()
            .append("polygon")
            .attr("class", "grid")
            .attr("transform", function (d) {
                return "translate(" + d.center.x + "," + d.center.y + ")";
            })
            .attr("points", function (d) { return d.points; });

        // Draw the cell groups
        this.cells = this.svg.selectAll("g").data(this.cellData())
            .enter()
            .append("g")
            .attr("class", "hex")
            .attr("transform", function (d) {
                return "translate(" + d.center.x + "," + d.center.y + ")";
            });

        // Draw the cells
        this.cells
            .append("polygon")
            .attr("points", function (d) { return d.points; })
            .attr("class", "hex");

        // Draw the labels
        this.cells
            .append("text")
            .text(function (d) { return d.value; })
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr("class", "label");

        // Update the scoreboard
        this.svg
            .append("text")
            .text("Score: ")
            .attr("x", "1.33em")
            .attr("y", "1.33em")
            .attr("class", "score")
            .attr("text-anchor", "start")
            .attr("alignment-baseline", "bottom");

        this.scoreboard = this.svg.append("text")
            .text(this.board.score)
            .attr("x", "8em")
            .attr("y", "1.33em")
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "bottom")
            .attr("class", "score");
    };

    /**
     * Joins the new data to the old on the cell's original position,
     * updates the positions, tweens the text values, and updates the
     * class of the cells.
     *
     * Also updates the score.
     */
    HTMLScreen.prototype.draw = function () {
        var data = this.cellData(),
            speed = this.speed,
            score = this.board.score,
            key = function (d) {
                return d.origPos.x.toString() + ", " + d.origPos.y.toString();
            },
            // We transition on a log scale
            color = d3.scale.log().base(2).domain([2, 2048]).range([this.minColor, this.maxColor]);

        // Transition cell locations
        this.cells
            .data(data, key)
            .transition()
            .duration(speed)
            .ease("cubic")
            .each("end", function () {
                // Tween the text value in the cell from current to final value (setting to blank if we hit zero)
                d3.select(this).select("text")
                    .transition()
                    .duration(speed)
                    .tween("cellValue", function (d) {
                        var i = d3.interpolateRound(Number(this.textContent), d.value || 0);

                        return function (t) {
                            var val = i(t);
                            this.textContent =
                                val === 0 ? "" : val;
                        };
                    });

                // Update cell classes after they're moved
                d3.select(this).select("polygon")
                    .attr("class", function (d) { return d.class; })
                    .transition()
                    .duration(speed)
                    .style("fill", function (d) { if (!d.value) { return "#ffffff"; } return color(d.value); });
            })
            .attr("transform", function (d) { return "translate(" + d.center.x + ", " + d.center.y + ")"; });

        // Update the scoreboard if the score has changed
        if (score.toString() !== this.scoreboard.text()) {
            this.scoreboard
                .transition()
                .duration(speed * 2)
                .attr("y", "-2em")
                    .remove();

            this.scoreboard = this.svg.append("text")
                .text(score)
                .attr("text-anchor", "end")
                .attr("alignment-baseline", "bottom")
                .attr("class", "score")
                .attr("x", "8em")
                .attr("y", "3.33em")
                .style("fill-opacity", 0);

            this.scoreboard
                .transition()
                .duration(speed * 2)
                .attr("y", "1.33em")
                .style("fill-opacity", 1);
        }
    };

    /**
     * Grabs the cell data from the board, then adds center location and polygon points
     */
    HTMLScreen.prototype.cellData = function () {
        var cells = this.board.cellData(),
            i;

        for (i = 0; i < cells.length; i++) {
            cells[i].center = this.hexCenter(cells[i].pos);
            cells[i].points = this.points;
        }

        return cells;
    };

    HTMLScreen.prototype.gridData = function () {
        var cells = this.board.cellData(),
            i;

        for (i = 0; i < cells.length; i++) {
            cells[i].center = this.hexCenter(cells[i].pos);
            cells[i].points = this.points;
        }

        return cells;
    };

    /**
     * Returns a vector containing the center of the indicated
     * hexagon
     */
    HTMLScreen.prototype.hexCenter = function (pos) {
        var xOffset = (this.hexW * pos.x) + (this.hexW * pos.y) + (0.5 * this.hexW * -pos.y),
            yOffset = ((0.75 * this.hexH) * pos.y) + 50,
            hexCenter = Vector.add(new Vector(xOffset, yOffset), this.center);

        // Also return the hexagon's value so we can use it.
        return hexCenter;
    };

    return HTMLScreen;
}());