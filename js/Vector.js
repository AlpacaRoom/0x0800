var Vector = (function () {
    "use strict";
    function Vector(x, y) {
        this.x = x;
        this.y = y;
        // For our hex grid we just calculate a z; we probably don't need this
        this.z = -this.x - this.y;
    }

    Vector.add = function (first, second) {
        return new Vector(first.x + second.x, first.y + second.y);
    };

    Vector.subtract = function (first, second) {
        return new Vector(first.x - second.x, first.y - second.y);
    };

    Vector.prototype.conjugate = function () {
        return new Vector(this.x, -this.y);
    };

    Vector.prototype.modulus = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };

    Vector.multiply = function (first, second) {
        var x = (first.x * second.x) + (first.y * second.y  * -1),
            y = (first.x * second.y) + (first.y * second.x);

        return new Vector(x, y);
    };

    Vector.divide = function (first, n) {
        return new Vector(first.x / n, first.y / n);
    };

    Vector.divideVector = function (first, second) {
        var conjugate = second.conjugate(),
            numerator = Vector.multiply(first, conjugate),
            denominator = Vector.multiply(second, conjugate);

        return Vector.divide(numerator, denominator.x);
    };

    Vector.dotProduct = function (first, second) {
        return (first.x * second.x) + (first.y * second.y);
    };

    return Vector;
}());