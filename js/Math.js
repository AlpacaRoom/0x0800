/**
 * Uses Dijkstra's algorithm to compute GCD
 */
Math.gcd = function (a, b) {
    if (b === a) {
        return b;
    }
    if (b > a) {
        return Math.gcd(b - a, a);
    } else {
        return Math.gcd(b, a - b);
    }
};

/**
 * Uses Euclid's algorithm to compute LCM
 */
Math.lcm = function (a, b) {
    return (a * b) / Math.gcd(a, b);
};

/**
 * Iterates over the list, finding LCM of each pair
 * and the next item
 */
Math.lcm_list = function (arr) {
    var i,
        result = arr[0];
    for (i = 1; i < arr.length; i++) {
        result = Math.lcm(result, arr[i]);
    }
    return result;
};