define(function(require, exports, module) {
  var emulator = require('kernel/emulator')
  exports.connect = function(element) {
    element.onkeydown = function(event) {
      emulator.int([3, event.keyCode]);
    }
  };
});