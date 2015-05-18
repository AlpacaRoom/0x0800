/*global Game */
window.requestAnimationFrame(function () {
    "use strict";
    var g = new Game({
        radius: 3,
        size: Math.min(500, window.innerWidth, window.innerHeight),
        speed: 200
    });
});