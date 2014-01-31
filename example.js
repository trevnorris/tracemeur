// You won't need the ./ in the name.
var tracemeur = require('./tracemeur');

var b = { test: function() { } };

tracemeur('b.', b, 'test');

for (var i = 0; i < 1000; i++) (function level1() {
  (function level2() {
    (function level3() {
      b.test();
    }());
  }());
}());
