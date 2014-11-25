define(function (require) {
  var Screen = require('app/canvasScreen');
  var Keyboard = require('app/keyboard');
  var asm = require('asm/index');
  var mem = require('kernel/memory');
  var emulator = require('kernel/emulator')
  var $ = require('kernel/util').$;

  var canvas = document.getElementById("screen");

  // init screen
  var scrn = new Screen(canvas, mem.text);
  mem.addGraphicsTarget(scrn);

  // init keyboard
  Keyboard.connect(canvas);

  // set emulator state watcher
  emulator.addStateWatcher(function(s) {
    var state = 'status: ' + s.status;
    state += ', freq: ' + s.frequency;
    state += ', IP: ' + s.reg.IP;
    state += ', flag: ' + s.flag;
    state += ', RegisterA: ' + s.reg.A;
    state += ', RegisterB: ' + s.reg.B;
    state += ', RegisterD: ' + s.reg.D;
    state += ', RegisterX: ' + s.reg.X;
    state += ', RegisterY: ' + s.reg.Y;
    document.getElementById("emulator-state").innerHTML = state;
  });


var condition = function() {var src = new String(function() {
/*
; print "HIJKL"
Start: 
 JMP #Spot1 
 LDA #65 
 LDX #$A000 
 STA ,X 
 JMP #EndSpot 
Spot1: 
 LDA #72 
 LDX #$A002 
 STA ,X 
 CMPA #72 
 JEQ #Spot2 
 JMP #EndSpot 
Spot2: 
 LDA #73 
 LDX #$A004 
 STA ,X 
 CMPA #99 
 JNE #Spot3 
 JMP #EndSpot 
Spot3: 
 LDA #74 
 LDX #$A006 
 STA ,X 
 CMPA #107 
 JLT #Spot4 
 JMP #EndSpot 
Spot4: 
 LDA #75 
 LDX #$A008 
 STA ,X 
 CMPA #12 
 JGT #Spot5 
 JMP #EndSpot 
Spot5: 
 LDA #76 
 LDX #$A00A 
 STA ,X 
 CMPA #92 
 JEQ #Spot6 
 JMP #EndSpot 
Spot6: 
 LDA #77 
 LDX #$A00C 
 STA ,X 
EndSpot: 
 END Start 
*/
}); return src.substr(17, src.length-22); }();
var binary = function() {var src = new String(function() {
/*
; print binary code
Start: 
 LDX #$A000 
 LDY #8
 LDA #48
 ;target
 LDB #$81
Loop1: 
 ROLB 
 ADCA 
 STA ,X 
 LDA #48 
 INCX 
 INCX 
 DECY 
 CMPY #$00 
 JNE #Loop1 
 END Start 
*/
}); return src.substr(17, src.length-22); }();
var random = function() {var src = new String(function() {
/*
; char *addr, *count; 
.data #3
START:

; addr = (char*)0xA000;
  LDX :#0
  LDY #$A000
  STY, X

; *count = 0;
  LDX :#2
  LDA #0
  STA, X

; loop:
; *addr = random(33, 126);
LOOP: 
  LDX #33
  LDY #126
  INT #1
  LDX [:#0]
  STB, X

; char tmp = *addr;
; tmp++;
; tmp++;
; *addr = tmp;
  LDY [:#0]
  INCY
  INCY
  LDX :#0
  STY, X

; char tmp = (*count) + 1;
  LDA [:#2]
  INCA

; if (tmp == 255) { goto end; }
  CMPA #255
  JEQ #END

; else { *count = tmp; goto loop; }
  LDX :#2
  STA, X
  JMP #LOOP

; end:
; exit();
END:
  END START
*/
}); return src.substr(17, src.length-22); }();
var echo = function() {var src = new String(function() {
/*
; print what you type
START:
  LDX :#0
  LDY #$A000
  STY, X

LOOP: 
  LDX #30
  INT #2
  INT #4
  CMPB #0
  JEQ #LOOP
  LDX [:#0]
  STB, X
  LDY [:#0]
  INCY
  INCY
  LDX :#0
  STY, X
  JMP #LOOP

  END START
*/
}); return src.substr(17, src.length-22); }();




  var codes = [condition, binary, random, echo];
  var exampleElements = document.getElementsByName("example");
  for (var i=0; i<exampleElements.length; i++) {
    exampleElements[i].onclick = function(i) {
      return function() {
        document.getElementById("code").value = codes[i];
      }
    }(i);
  }

  var compileAndRunElement = document.getElementById("compileAndRun");
  compileAndRunElement.onclick = function() {
    var x = document.getElementById("code").value;
    var bin = asm.compile(x, {debug: true}, function(err, bin) {
      var compilingElement = document.getElementById("compilingStatus");
      if (err) {
        compilingElement.innerHTML = "Compile failed at line " + (err.line||0) + ", column " + (err.column||0) + ": " + (err.message||'unknown');
      } else {
        emulator.run(bin);
        compilingElement.innerHTML = "Compile success. <<" + bin.join(',') + ">>";
      }
    });
  }

});
