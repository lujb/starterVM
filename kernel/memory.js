var $ = require('./util').$;

var mem = []; // 64k  0x0000 .. 0xFFFF
var graphicsTargets = [];
var TEXT = {
  size: 4000,
  from: $('0xA000'),
  to: $('0xAFA0')
};
var INT = {
  size: 512,
  from: $('0x0400'),
  to: $('0x05FF')
};
var STACK = {
  size: 1024,
  from: $('0xFC00'),
  to: $('0xFFFF')
};
var IBUFF = {
  size: 2048,
  from: $('0xF400'),
  to: $('0xFBFF')
}


// init memory array
for (var i=0; i<=$('0xFFFF'); i++) { mem[i] = 0; }

// load interrupt descriptor table
mem[$('0x0400')]=0, mem[$('0x0401')]=0; // load INT#0
mem[$('0x0402')]=0, mem[$('0x0403')]=0; // load INT#1
mem[$('0x0404')]=0, mem[$('0x0405')]=0; // load INT#2


exports.text = TEXT;
exports.int = INT;
exports.stack = STACK;
exports.ibuff = IBUFF;

exports.addGraphicsTarget = function(target) {
  target.redraw();
  graphicsTargets.push(target);
}

exports.resetGraphicsTargets = function() {
  graphicsTargets.forEach(function(target) {
    target.reset.call(target);
  });
}


exports.read = function(i, n) {
  n = n || 1;
  if ((i+n) > $('0xFFFF')) {
    // TODO
    console.log('mem::read: invalid memory access');
  } else {
    if (n === 1) {
      return mem[i];
    } else {
      return mem.slice(i, i + (n||1));
    }
  }
}

exports.getINT = function (n) {
  if (n>=0 && n<=255) {

  }
}

exports.write = function(addr, byteArray) {
  for (var i=0; i< byteArray.length; i++) {
    mem[addr + i] = byteArray[i];
  }

  graphicsTargets.forEach(function(target) {
    target.redraw.call(target);
  });
}

exports._write = function(addr, byteArray) {
  for (var i=0; i< byteArray.length; i++) {
    mem[addr + i] = byteArray[i];
  }
}