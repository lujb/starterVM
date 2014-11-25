define(function (require, exports, module) {/*
  Assembler for starterVM.
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

var parse = require('./asm').parse

module.exports.compile = function(src) {
  var options, cb, out;
  if (arguments.length === 2) {
    options = [];
    cb = arguments[1];
  } else if(arguments.length === 3) {
    options = arguments[1];
    cb = arguments[2];
  }

  if (!cb) {
    cb = function(){};
  }

  try {
    out = parse(src, options);
    out = revise(out, options);
    cb(null, out);
  } catch (err) {
    cb(err);
  }
}

function revise(out, options) {
  var header = [66, 51, 50] // 'B', '3', '2'
  var base = options.base || 4096;

  if (typeof out.start === 'number') {
    out.start += base;
  } else {
    out.start = base + (out.ltable[out.start] || 0);
  } 

  [base, out.start].forEach(function(addr) {
    header.push(h(addr));
    header.push(l(addr));
  });

  // Fix all unfills
  for (var offset in out.unfills) {
    var label = out.unfills[offset];
    var value = out.ltable[label.value];
    if (value !== undefined) {
      offset = parseInt(offset);
      var addr = base + value;
      out.code[offset] = h(addr);
      out.code[offset+1] = l(addr);
    } else {
      var err = {
        line: label.line,
        column: label.column,
        message: 'Failed to resolve label:' + label.value 
      }
      throw(err);
    }
  }

  // Resolve all unresolved addresses
  out.unresolved.forEach(function(offset) {
    var hi = out.code[offset];
    var lo = out.code[offset+1];
    var resolvedAddr = (hi<<8) + lo + base;
    out.code[offset] = h(resolvedAddr);
    out.code[offset+1] = l(resolvedAddr);
  })

  return header.concat(out.code);
}

function h(word) {
  return word >> 8;
}

function l(word) {
  return word & 255;
}
});
