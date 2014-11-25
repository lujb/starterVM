define(function(require, exports, module) {
  var mem = require('kernel/memory');

  // Text memory unit(2 bytes)
  // ------------------------------------
  //  char byte|   attribute byte        
  // ------------------------------------
  //   0..7    | 8 9 10 11 | 12 13 14 15
  // Character | Forecolor |  Backcolor

  var Screen = function(canvas, text) {
    this.canvas = canvas; 
    this.text = text;
    this.context = canvas.getContext("2d");
    this.ROWS = 25;
    this.COLUMNS = 80;
    this.ratio = {x: 8, y: 15 };
    this.resize();

    // init text memory
    this.reset();
  }

  Screen.prototype.setRatio = function(x, y) {
    this.ratio.x = x;
    this.ratio.y = y;
    this.resize();
  }

  Screen.prototype.getRatio = function() {
    return this.ratio;
  }

  Screen.prototype.enableGrid = function(enabled) {
    if (enabled) {
      this.showGrid = true;
    } else {
      this.showGrid = false;
    }
  }

  // redraw screen
  Screen.prototype.redraw = function() {
    for (var i = 0; i < this.text.size/2; i++) {
      var ch = mem.read(this.text.from + i*2);
      var attr = mem.read(this.text.from + i*2 + 1);
      var x = (i % this.COLUMNS) * this.ratio.x;
      var y = this.ratio.y * Math.floor(i / this.COLUMNS);

      // redraw backcolor
      this.context.fillStyle = getColorCode(attr >> 4);
      this.context.fillRect(x, y, this.ratio.x, this.ratio.y);

      // redraw character using forecolor
      if (ch) {
        ch = String.fromCharCode(ch);
        this.context.font = "bold " + this.ratio.y + "px Courier New";
        this.context.fillStyle = getColorCode(attr & 15);
        this.context.fillText(ch, x, y + this.ratio.y, this.ratio.x);
      }
    }

    this.drawGrid();
  }

  // resize screen by ratio
  Screen.prototype.resize = function() {
    this.canvas.width = this.COLUMNS * this.ratio.x;
    this.canvas.height = this.ROWS * this.ratio.y;
  }

  // reset screen
  Screen.prototype.reset = function() {
    for (var i=this.text.from; i<=this.text.to; i+=2) {
      mem._write(i, [0, 15]); //forecolor: white, backcolor:black
    }
  }

  // draw grid if enabled
  Screen.prototype.drawGrid = function() {
    if (this.showGrid) {
      for (var x = 0.5; x < this.canvas.width; x += this.ratio.x) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, this.canvas.height);
      }

      for (var y = 0.5; y < this.canvas.height; y += this.ratio.y) {
        this.context.moveTo(0, y);
        this.context.lineTo(this.canvas.width, y);
      }

      this.context.strokeStyle = "#222";
      this.context.stroke();
    }
  }

  function getColorCode(n) {
    switch(n) {
      case 0: return '#000'; // black
      case 1: return '#00F'; // blue
      case 2: return '#0F0'; // green
      case 3: return '#0FF'; // cyan
      case 4: return '#F00'; // red
      case 5: return '#C09'; // magenta
      case 6: return '#630'; // brown
      case 7: return '#CCC'; // light grey
      case 8: return '#444'; // dark grey
      case 9: return '#39F'; // light blue
      case 10: return '#9F6'; // light green
      case 11: return '#CFF'; // light cyan
      case 12: return '#F60'; // light red
      case 13: return '#F6F'; // light magenta
      case 14: return '#C60'; // light brown
      case 15: return '#FFF'; // white 
    }
  }




  module.exports = Screen;
});
