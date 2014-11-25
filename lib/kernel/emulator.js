define(function (require, exports, module) {/*
  Emulator for starterVM.
  http://github.com/lujb/starterVM
  
  Copyright (c) 2014 by Kingbo Lu
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

var $ = require('./util').$;
var assert = require('./util').assert;
var mem = require('./memory');

// emulator state
var s = {};
s.frequency = 100;
s.status = 'wait'; // wait/run/error

s.flag = 0;
var EQ = 1, NE = 2, LT = 4, GT = 8, Overflow = 16, Carry = 32;
/*************************************************\
|   ....   |   5   |    4     | 3  | 2  | 1  | 0  |
|-------------------------------------------------|
| (unused) | Carry | Overflow | GT | LT | NE | EQ |
\*************************************************/

// All registers are big endian
s.reg = {};
s.reg.A = 0;
s.reg.B = 0;
s.reg.D = 0;
s.reg.X = 0; // 2 bytes
s.reg.Y = 0; // 2 bytes
s.reg.IP = 0; // 2 bytes
// s.reg.SP = mem.stack.to + 1;

s.ints = []; // interrupt signals

var sleep = {
  n: 0,
  set: function(n) {
    this.n = n;
  },
  get: function() {
    var n = this.n;
    this.n = 0;
    return n;
  }
}

var ibuff = {
  head: mem.ibuff.from,
  tail: mem.ibuff.from,
  put: function(value) {
    if (mem.read(this.tail) === 0) {
      mem.write(this.tail, [value]);
      this.tail = (this.tail+1) % mem.ibuff.size + mem.ibuff.from;
    } else {
      // console.log('input buff overflow.');
    }
  },
  get: function() {
    var value = mem.read(this.head);
    if (value) {
      mem.write(this.head, [0]);
      this.head = (this.head+1) % mem.ibuff.size + mem.ibuff.from;
    } else {
      // console.log('input buff is empty.');
    }
    return value;
  }
}


function setReg(id, value) {
  s.reg[id] = value;
  if (id === 'A' || id === 'B') {
    s.reg.D = s.reg.A << 8 + s.reg.B;
  } else if (id === 'D') {
    s.reg.A = s.reg.D >> 8;
    s.reg.B = s.reg.D & 255;
  }

  stateChanged();
}

function getReg(id) {
  return s.reg[id];
}

function setStatus(value) {
  s.status = value;
  stateChanged();
}

function setFlag(value) {
  s.flag = value;
  stateChanged();
}

function getFlag() {
  return s.flag;
}

var stateWatchers = [];


exports.setFrequency = function(freq) {
  if (typeof freq === 'number') {
    if (freq >= 0) {
      s.frequency = freq;
    }
  }
}

exports.addStateWatcher = function(watcher) {
  stateWatchers.push(watcher);
  watcher(s);
}

exports.run = function(prog) {
  if (prog.slice(0, 3).join('') === '665150') {
    var startPart = prog.slice(3, 5);
    var execPart = prog.slice(5, 7);
    var startAddr = (startPart[0] << 8) + startPart[1];
    var execAddr = (execPart[0] << 8) + execPart[1];
    
    mem.resetGraphicsTargets();
    mem.write(startAddr, prog.slice(7));
    setReg('IP', execAddr)
    setStatus('run');
    loop();

  } else {
    // TODO
    setStatus('error');
    console.log('emulator::run: invalid program')
  }
}

exports.int = function(n) {
  s.ints.push(n);
}


// loop of fetch-decode-execute
function loop() {
  if (s.status === 'run') {
    // we first check if we have interrupt signal
    if (s.ints.length > 0) {
      while(s.ints.length) {
        var n = s.ints.shift();
        interrupt(n);
        // var handlerAddr = mem.getINT(n);
        // mem.write(mem.int.from-2, [s.reg.IP>>8, s.reg.IP&256]);
        // s.reg.IP = handlerAddr;
      }
    } else {
      var inst = decode(fetch());
      assert(typeof inst === 'object');

      inst.execute();
    }

    var delay = sleep.get();
    if (s.frequency) {
      setTimeout(loop, Math.ceil(1000/s.frequency) + delay);
    } else {
      if (delay) setTimeout(loop, delay);
      else loop();
    }
  }
}

function stateChanged() {
  stateWatchers.forEach(function(watcher) {
    watcher(s);
  })
}

function fetch(n) {
  n = n || 1;
  var bytes = mem.read(s.reg.IP, n);

  assert(bytes !== undefined);
  s.reg.IP += n;
  stateChanged();

  return bytes;
}

function fetch2() {
  var word = fetch(2);
  return word2Value(word);
}

function word2Value(bytes) {
  return (bytes[0]<<8) + bytes[1]; 
}

function value2Word(value) {
  return [value>>8, value&255];
}

function decode(code) {
  switch(code) {
    case 1: return new LDA(fetch());
    case 2: return new LDX(fetch2());
    case 3: return new STA();
    case 4: return new END();
    case 5: return new CMPA(fetch());
    case 6: return new CMPB(fetch());
    case 7: return new CMPX(fetch2());
    case 8: return new CMPY(fetch2());
    case 9: return new CMPD(fetch2());
    case 10: return new JMP(fetch2());
    case 11: return new JEQ(fetch2());
    case 12: return new JNE(fetch2());
    case 13: return new JGT(fetch2());
    case 14: return new JLT(fetch2());
    case 15: return new INCA();
    case 16: return new INCB();
    case 17: return new INCX();
    case 18: return new INCY();
    case 19: return new INCD();
    case 20: return new DECA();
    case 21: return new DECB();
    case 22: return new DECX();
    case 23: return new DECY();
    case 24: return new DECD();
    case 25: return new ROLA();
    case 26: return new ROLB();
    case 27: return new RORA();
    case 28: return new RORB();
    case 29: return new ADCA();
    case 30: return new ADCB();
    case 31: return new ADDA(fetch());
    case 32: return new ADDB(fetch());
    case 33: return new ADDAB();
    case 34: return new LDB(fetch());
    case 35: return new LDY(fetch2());
    case 36: return new INT(fetch());
    case 37: return new STB();
    case 38: return new LDX2(fetch2());
    case 39: return new STY();
    case 40: return new LDY2(fetch2());
    case 41: return new LDA2(fetch2());
    default: 
      setStatus('error');
      console.log('emulator::run: invalid instruction code #' + code);
  }
}

function interrupt(n) {
  var num = n[0] || n;
  switch(num) {
    // Returns a pseudo-random integer between value in X register
    // and value in Y register, then set it into D register.
    case 1:
      var min = getReg('X');
      var max = getReg('Y');

      if (min > max) {
        min = min ^ max;
        max = max ^ min;
        min = min ^ max
      }

      var value = Math.floor(Math.random() * (max - min +1)) + min;
      setReg('D', value);
      return;

    // Sleep n milliseconds before executing next instruction
    case 2:
      sleep.set(getReg('X'));
      return;

    // keyPress
    case 3:
      ibuff.put(n[1]);
      return;

    // Return a value from ibuff, and set it to B register
    case 4:
      var value = ibuff.get();
      setReg('B', value);
      return;

    default:
      console.log('unknown interrupt found:', n);
      s.reg.IP = 0;
      setStatus('error');
  }  
}



// instruction implementaion
// LDA #value
function LDA(value){
  this.value = value;
  this.execute = function() {
    setReg('A', this.value);
  }
}

// LDA2 [#value]
function LDA2(value){
  this.value = value;
  this.execute = function() {
    setReg('A', mem.read(this.value));
  }
}

// LDB #value
function LDB(value){
  this.value = value;
  this.execute = function() {
    setReg('B', this.value);
  }
}

// LDX #value
function LDX(value) {
  this.value = value;
  this.execute = function() {
    setReg('X', this.value);
  }
}

// LDX2 [#value]
function LDX2(value) {
  this.value = value;
  this.execute = function() {
    var word = mem.read(value, 2);
    setReg('X', word2Value(word));
  }
}

// LDY #value
function LDY(value) {
  this.value = value;
  this.execute = function() {
    setReg('Y', this.value);
  }
}

// LDY2 [#value]
function LDY2(value) {
  this.value = value;
  this.execute = function() {
    var word = mem.read(value, 2);
    setReg('Y', word2Value(word));
  }
}

// STA, X
function STA() {
  this.execute = function() {
    var value = getReg('A');
    var addr = getReg('X');
    mem.write(addr, [value]);
  }
}

// STB, X
function STB() {
  this.execute = function() {
    var value = getReg('B');
    var addr = getReg('X');
    mem.write(addr, [value]);
  }
}

// STY, X
function STY() {
  this.execute = function() {
    var value = getReg('Y');
    var addr = getReg('X');
    mem.write(addr, value2Word(value));
  }
}

// END
function END() {
  this.execute = function() {
    setStatus('wait');
  }
}

// CMPA　#value
function CMPA(value) {
  this.value = value;
  this.execute = function() {
    cmp(getReg('A'), this.value);
  }
}

// CMPB　#value
function CMPB(value) {
  this.value = value;
  this.execute = function() {
    cmp(getReg('B'), this.value);
  }
}

// CMPX　#value
function CMPX(value) {
  this.value = value;
  this.execute = function() {
    cmp(getReg('X'), this.value);
  }
}

// CMPY　#value
function CMPY(value) {
  this.value = value;
  this.execute = function() {
    cmp(getReg('Y'), this.value);
  }
}

// CMPD　#value
function CMPD(value) {
  this.value = value;
  this.execute = function() {
    cmp(getReg('D'), this.value);
  }
}

// JMP #value
function JMP(value) {
  this.value = value;
  this.execute = function() {
    setReg('IP', this.value);
  }
}

// JEQ #value
function JEQ(value) {
  this.value = value;
  this.execute = function() {
    if (getFlag() & EQ) {
      setReg('IP', this.value);
    }
  }
}

// JNE #value
function JNE(value) {
  this.value = value;
  this.execute = function() {
    if (getFlag() & NE) {
      setReg('IP', this.value);
    }
  }
}

// JLT #value
function JLT(value) {
  this.value = value;
  this.execute = function() {
    if (getFlag() & LT) {
      setReg('IP', this.value);
    }
  }
}

// JGT #value
function JGT(value) {
  this.value = value;
  this.execute = function() {
    if (getFlag() & GT) {
      setReg('IP', this.value);
    }
  }
}

// INCA
function INCA() {
  this.execute = function() {
    var value = getReg('A');

    overflow(value===255);
    setReg('A', (++value)%256);
  }
}

// INCB
function INCB() {
  this.execute = function() {
    var value = getReg('B');

    overflow(value===255);
    setReg('B', (++value)%256);
  }
}

// INCX
function INCX() {
  this.execute = function() {
    var value = getReg('X');

    overflow(value===65535);
    setReg('X', (++value)%65536);
  }
}

// INCY
function INCY() {
  this.execute = function() {
    var value = getReg('Y');

    overflow(value===65535);
    setReg('Y', (++value)%65536);
  }
}

// INCD
function INCD() {
  this.execute = function() {
    var value = getReg('D');

    overflow(value===65535);
    setReg('D', (++value)%65536);
  }
}

// DECA
function DECA() {
  this.execute = function() {
    var value = getReg('A');

    overflow(false);
    if (value) {
      setReg('A', getReg('A')-1);
    }
  }
}

// DECB
function DECB() {
  this.execute = function() {
    var value = getReg('B');

    overflow(false);
    if (value) {
      setReg('B', getReg('B')-1);
    }
  }
}

// DECX
function DECX() {
  this.execute = function() {
    var value = getReg('X');

    overflow(false);
    if (value) {
      setReg('X', getReg('X')-1);
    }
  }
}

// DECY
function DECY() {
  this.execute = function() {
    var value = getReg('Y');

    overflow(false);
    if (value) {
      setReg('Y', getReg('Y')-1);
    }
  }
}

// DECD
function DECD() {
  this.execute = function() {
    var value = getReg('D');

    overflow(false);
    if (value) {
      setReg('D', getReg('D')-1);
    }
  }
}

// ROLA
function ROLA() {
  this.execute = function() {
    var value = getReg('A');
    var carried = s.flag & Carry;

    carry(value & 128);
    value <<= 1;
    if (carried) {
      value |= 1;
    }
    setReg('A', value);
  }
}

// ROLB
function ROLB() {
  this.execute = function() {
    var value = getReg('B');
    var carried = s.flag & Carry;

    carry(value & 128);
    value <<= 1;
    if (carried) {
      value |= 1;
    }
    setReg('B', value);
  }
}

// RORA
function RORA() {
  this.execute = function() {
    var value = getReg('A');
    var carried = s.flag & Carry;

    carry(value & 1);
    value >>= 1;
    if (carried) {
      value |= 128;
    }
    setReg('A', value);
  }
}

// RORB
function RORB() {
  this.execute = function() {
    var value = getReg('B');
    var carried = s.flag & Carry;

    carry(value & 1);
    value >>= 1;
    if (carried) {
      value |= 128;
    }
    setReg('B', value);
  }
}

// ADCA
function ADCA() {
  this.execute = function() {
    var value = getReg('A');

    if (getFlag() & Carry) { // if set carry
      overflow(value===255);
      setReg('A', (++value)%256);
    }
  }  
}

// ADCB
function ADCB() {
  this.execute = function() {
    var value = getReg('B');

    if (getFlag() & Carry) { // if set carry
      overflow(value===255);
      setReg('B', (++value)%256);
    }
  }  
}

// ADDA
function ADDA(value) {
  this.value = value;
  this.execute = function() {
    var im = getReg('A') + this.value;

    if (im > 255) {
      carry(true); // set carry
    } else {
      carry(false); // unset carry
    }
    setReg('A', im % 256);
  }
}

// ADDB
function ADDB(value) {
  this.value = value;
  this.execute = function() {
    var im = getReg('B') + this.value;

    if (im > 255) {
      carry(true); // set carry
    } else {
      carry(false); // unset carry
    }
    setReg('B', im % 256);
  }
}

// ADDAB
function ADDAB() {
  this.execute = function() {
    var im = getReg('A') + getReg('B');

    if (im > 255) {
      carry(true);
    } else {
      carry(false);
    }
    setReg('D', im);
  }
}

// INT
function INT(value) {
  this.value = value;
  this.execute = function() {
    s.ints.push(this.value);
  }
}


// update overflow flag
function overflow(yes) {
  if (yes) {
    s.flag |= Overflow; // set overflow
  } else {
    s.flag &= ~Overflow; // unset overflow
  }
}

// update carry flag
function carry(yes) {
  if (yes) {
    s.flag |= Carry;  // set carry
  } else {
    s.flag &= ~Carry; // unset carry
  }
}

// compare and set flag
function cmp(source, target) {
  if (source === target) {
    s.flag |= EQ;  //set EQ
    s.flag &= ~NE; //unset NE
    s.flag &= ~LT; //unset LT
    s.flag &= ~GT; //unset GT
  } else if (source < target){
    s.flag &= ~EQ; //unset EQ
    s.flag |= NE;  //set NE
    s.flag |= LT;  //set LT
    s.flag &= ~GT; //unset GT
  } else { // source > target
    s.flag &= ~EQ; //unset EQ
    s.flag |= NE;  //set NE
    s.flag &= ~LT; //unset LT
    s.flag |= GT;  //set GT
  }
}

});
