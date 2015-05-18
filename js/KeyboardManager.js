/**
 * Shamelessly ganked from 2048 by Gabriele Cirulli
 */
var KeyboardManager = (function () {
    "use strict";
    function KeyboardManager() {
        this.events = {};

        if (window.navigator.msPointerEnabled) {
            //Internet Explorer 10 style
            this.eventTouchstart    = "MSPointerDown";
            this.eventTouchmove     = "MSPointerMove";
            this.eventTouchend      = "MSPointerUp";
        } else {
            this.eventTouchstart    = "touchstart";
            this.eventTouchmove     = "touchmove";
            this.eventTouchend      = "touchend";
        }

        this.listen();
    }

    KeyboardManager.prototype.on = function (event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    };

    KeyboardManager.prototype.emit = function (event, data) {
        var callbacks = this.events[event];
        if (callbacks) {
            callbacks.forEach(function (callback) {
                callback(data);
            });
        }
    };

    KeyboardManager.prototype.listen = function () {
        var self = this,
            map = {
                38: 0, // Up
                39: 1, // Right
                40: 2, // Down
                37: 3, // Left
                75: 0, // Vim up
                76: 1, // Vim right
                74: 2, // Vim down
                72: 3, // Vim left
                87: 0, // W
                68: 1, // D
                83: 2, // S
                65: 3  // A
            },
            touchStartClientX,
            touchStartClientY,
            dx,
            dy,
            gameContainer = document.getElementById("gameBoard");

        document.addEventListener("keydown", function (e) {
            var modifiers = e.altKey || e.ctrlKey || e.metaKey ||
                    e.shiftKey,
                mapped = map[e.which];

            if (!modifiers) {
                if (mapped !== undefined) {
                    e.preventDefault();
                    self.emit("move", mapped);
                }
            }

            // Restart on R
            if (!modifiers && e.which === 82) {
                self.reset(self, e);
            }
        });

        // Respond to swipe events
        gameContainer.addEventListener(this.eventTouchstart, function (event) {
            if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
                    event.targetTouches > 1) {
                return; // Ignore if touching with more than 1 finger
            }

            if (window.navigator.msPointerEnabled) {
                touchStartClientX = event.pageX;
                touchStartClientY = event.pageY;
            } else {
                touchStartClientX = event.touches[0].clientX;
                touchStartClientY = event.touches[0].clientY;
            }

            event.preventDefault();
        });

        gameContainer.addEventListener(this.eventTouchmove, function (event) {
            event.preventDefault();
        });

        gameContainer.addEventListener(this.eventTouchend, function (event) {
            if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
                    event.targetTouches > 0) {
                return; // Ignore if still touching with one or more fingers
            }

            var touchEndClientX, touchEndClientY;

            if (window.navigator.msPointerEnabled) {
                touchEndClientX = event.pageX;
                touchEndClientY = event.pageY;
            } else {
                touchEndClientX = event.changedTouches[0].clientX;
                touchEndClientY = event.changedTouches[0].clientY;
            }

            dx = touchEndClientX - touchStartClientX;
            dy = touchEndClientY - touchStartClientY;

            if (Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
                // (right : left) : (down : up)
                self.emit("move", Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
            }
        });
    };

    KeyboardManager.prototype.reset = function (e) {
        e.preventDefault();
        this.emit("reset");
    };

    KeyboardManager.prototype.hex = function (e) {
        e.preventDefault();
        this.emit("hex", e);
    };

    KeyboardManager.prototype.bindButtonPress = function (selector, callback) {
        var button = document.querySelectorAll(selector),
            i;
        for (i = 0; i < button.length; i++) {
            button[i].addEventListener("click", callback.bind(this));
        }
    };

    return KeyboardManager;
}());