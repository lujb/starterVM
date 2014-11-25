{
  var start = 0;
  var labelTable = {};
  var unfills = {};
  var objectCode = [];
  var unresolvedAddr = [];
  
  var NIL = 0;
  var LDA = 1;
  var LDX = 2;
  var STA_X = 3;
  var END = 4;
  var CMPA = 5;
  var CMPB = 6;
  var CMPX = 7;
  var CMPY = 8;
  var CMPD = 9;
  var JMP = 10;
  var JEQ = 11;
  var JNE = 12;
  var JGT = 13;
  var JLT = 14;
  var INCA = 15;
  var INCB = 16;
  var INCX = 17;
  var INCY = 18;
  var INCD = 19;
  var DECA = 20;
  var DECB = 21;
  var DECX = 22;
  var DECY = 23;
  var DECD = 24;
  var ROLA = 25;
  var ROLB = 26;
  var RORA = 27;
  var RORB = 28;
  var ADCA = 29;
  var ADCB = 30;
  var ADDA = 31;
  var ADDB = 32;
  var ADDAB = 33;
  var LDB = 34;
  var LDY = 35;
  var INT = 36;
  var STB_X = 37;
  var LDX2 = 38;
  var STY_X = 39;
  var LDY2 = 40;
  var LDA2 = 41;

  var options = arguments[1] || {};

  function debug(msg){
    if (options.debug) {
      console.log('[ASM line:' + line() + '] ' + msg);
    }
  };

  function pushLabel(label) {
    unfills[objectCode.length] = label;
    // zero-fill 
    objectCode.push(0);
    objectCode.push(0);
  }
}


start
  = line* {
    return {
      start: start,
      code: objectCode,
      ltable: labelTable,
      unfills: unfills,
      unresolved: unresolvedAddr
    };
  }

line
  = nonsense
  / labelDef
  / instruction

labelDef
  = label:word ws* ':' ws* terminal {
    debug('define label: ' + label);
    labelTable[label] = objectCode.length;
  } 

instruction
  = ws+ mnemonic ws* terminal
  / '.data' ws+ value:immediate ws* terminal {
    while(value--) {
      objectCode.push(NIL);
    }
  }

mnemonic
  = LDA / LDB/ LDX / LDY / STA_X / STB_X /STY_X
  / CMPA / CMPB / CMPX / CMPY / CMPD
  / JMP / JEQ / JNE / JGT / JLT
  / INCA / INCB / INCX / INCY / INCD
  / DECA / DECB / DECX / DECY / DECD
  / ROLA / ROLB / RORA / RORB
  / ADCA / ADCB / ADDA / ADDB / ADDAB
  / INT
  / END

LDA
  = 'LDA' ws+ operand:value {
    var val = operand.value || operand;
    if (val > 255) {
      debug("the operand of 'LDA' is illegal");
      // TODO:reject
    }
    if (operand.type === 'address') {
      objectCode.push(LDA2);
      objectCode.push(operand.value >> 8);
      objectCode.push(operand.value & 255);
      debug('LDA [' + operand.value + ']');
    } else {
      objectCode.push(LDA);
      objectCode.push(operand & 255);
      debug('LDA ' + operand);
    }
  }

LDB
  = 'LDB' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'LDB' is illegal");
      // TODO:reject
    } 
    objectCode.push(LDB);
    objectCode.push(operand & 255);
    debug('LDB ' + operand);
  }

LDX
  = 'LDX' ws+ operand:value {
    var val = operand.value || operand;
    if (val > 65535) {
      debug("the operand of 'LDX' is illegal");
      // TODO:reject
    }
    if (operand.type === 'address') {
      objectCode.push(LDX2);
      objectCode.push(operand.value >> 8);
      objectCode.push(operand.value & 255);
      debug('LDX [' + operand.value + ']');
    } else {
      objectCode.push(LDX);
      objectCode.push(operand >> 8);
      objectCode.push(operand & 255);
      debug('LDX ' + operand);
    }
  }

LDY
  = 'LDY' ws+ operand:value {
    var val = operand.value || operand;
    if (val > 65535) {
      debug("the operand of 'LDY' is illegal");
      // TODO:reject
    }
    if (operand.type === 'address') {
      objectCode.push(LDY2);
      objectCode.push(operand.value >> 8);
      objectCode.push(operand.value & 255);
      debug('LDY [' + operand.value + ']');
    } else {
      objectCode.push(LDY);
      objectCode.push(operand >> 8);
      objectCode.push(operand & 255);
      debug('LDY ' + operand);
    }
  }

STA_X
  = 'STA' ws* ',' ws* 'X'  {
    objectCode.push(STA_X);
    debug('STA,X');
  }

STB_X
  = 'STB' ws* ',' ws* 'X'  {
    objectCode.push(STB_X);
    debug('STB,X');
  }

STY_X
  = 'STY' ws* ',' ws* 'X'  {
    objectCode.push(STY_X);
    debug('STY,X');
  }

END
  = 'END' ws+ label:word {
    if (labelTable[label] === undefined) {
      start = label;
    } else {
      start = labelTable[label];
    }
    objectCode.push(END);
    debug('END ' + label);
  }

CMPA
  = 'CMPA' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'CMPA' is illegal");
      // TODO:reject
    } 
    objectCode.push(CMPA);
    objectCode.push(operand & 255);
    debug('CMPA ' + operand);
  }

CMPB
  = 'CMPB' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'CMPB' is illegal");
      // TODO:reject
    } 
    objectCode.push(CMPB);
    objectCode.push(operand & 255);
    debug('CMPB ' + operand);
  }

CMPX
  = 'CMPX' ws+ operand:immediate {
    if (operand > 65535) {
      debug("the operand of 'CMPX' is illegal");
      // TODO:reject
    } 
    objectCode.push(CMPX);
    objectCode.push(operand >> 8);
    objectCode.push(operand & 255);
    debug('CMPX ' + operand);
  }

CMPY
  = 'CMPY' ws+ operand:immediate {
    if (operand > 65535) {
      debug("the operand of 'CMPY' is illegal");
      // TODO:reject
    } 
    objectCode.push(CMPY);
    objectCode.push(operand >> 8);
    objectCode.push(operand & 255);
    debug('CMPY ' + operand);
  }

CMPD
  = 'CMPD' ws+ operand:immediate {
    if (operand > 65535) {
      debug("the operand of 'CMPD' is illegal");
      // TODO:reject
    } 
    objectCode.push(CMPD);
    objectCode.push(operand >> 8);
    objectCode.push(operand & 255);
    debug('CMPD ' + operand);
  }

JMP
  = 'JMP' ws+ label:labelVal {
    objectCode.push(JMP);
    pushLabel(label);
    debug('JMP ' + label.value);
  }

JEQ
  = 'JEQ' ws+ label:labelVal {
    objectCode.push(JEQ);
    pushLabel(label);
    debug('JEQ ' + label.value);
  }

JNE
  = 'JNE' ws+ label:labelVal {
    objectCode.push(JNE);
    pushLabel(label);
    debug('JNE ' + label.value);
  }

JGT
  = 'JGT' ws+ label:labelVal {
    objectCode.push(JGT);
    pushLabel(label);
    debug('JGT ' + label.value);
  }

JLT
  = 'JLT' ws+ label:labelVal {
    objectCode.push(JLT);
    pushLabel(label);
    debug('JLT ' + label.value);
  }

INCA
  = 'INCA' {
    objectCode.push(INCA);
    debug('INCA');
 }

INCB
  = 'INCB' {
    objectCode.push(INCB);
    debug('INCB');
 }

INCX
  = 'INCX' {
    objectCode.push(INCX);
    debug('INCX');
 }

INCY
  = 'INCY' {
    objectCode.push(INCY);
    debug('INCY');
 }

INCD
  = 'INCD' {
    objectCode.push(INCD);
    debug('INCD');
 }

DECA
  = 'DECA' {
    objectCode.push(DECA);
    debug('DECA');
 }

DECB
  = 'DECB' {
    objectCode.push(DECB);
    debug('DECB');
 }

DECX
  = 'DECX' {
    objectCode.push(DECX);
    debug('DECX');
 }

DECY
  = 'DECY' {
    objectCode.push(DECY);
    debug('DECY');
 }

DECD
  = 'DECD' {
    objectCode.push(DECD);
    debug('DECD');
 }

ROLA
  = 'ROLA' {
    objectCode.push(ROLA);
    debug('ROLA');
  }

ROLB
  = 'ROLB' {
    objectCode.push(ROLB);
    debug('ROLB');
  }

RORA
  = 'RORA' {
    objectCode.push(RORA);
    debug('RORA');
  }

RORB
  = 'RORB' {
    objectCode.push(RORB);
    debug('RORB');
  }

ADCA
  = 'ADCA' {
    objectCode.push(ADCA);
    debug('ADCA');
  }

ADCB
  = 'ADCB' {
    objectCode.push(ADCB);
    debug('ADCB');
  }

ADDA
  = 'ADDA' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'ADDA' is illegal");
      // TODO:reject
    } 
    objectCode.push(ADDA);
    objectCode.push(operand & 255);
    debug('ADDA' + operand);
  }

ADDB
  = 'ADDB' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'ADDB' is illegal");
      // TODO:reject
    } 
    objectCode.push(ADDB);
    objectCode.push(operand & 255);
    debug('ADDB' + operand);
  }

ADDAB
  = 'ADDAB' {
    objectCode.push(ADDAB);
    debug('ADDAB');
  }

INT
  = 'INT' ws+ operand:immediate {
    if (operand > 255) {
      debug("the operand of 'INT' is illegal");
      // TODO:reject
    } 
    objectCode.push(INT);
    objectCode.push(operand & 255);
    debug('INT ' + operand);
  }


labelVal
  = '#' label:word {
    return {
      value: label,
      line: line(),
      column: column()
    }
  }


word
  = char:[a-zA-z] latter:[a-zA-Z0-9]* {
    return char + latter.join('');
  }

value
  = address / immediate

address
  = '[' ws* value:immediate ws* ']' {
    return {
      type: 'address',
      value: value
    }
  }

immediate
  = offset / integer

offset
  = ':' value:integer {
    unresolvedAddr.push(objectCode.length+1);
    return value;
  }

integer
  = '#$' value:[0-9a-fA-F]+ {
    value = '0x' + value.join('');
    return parseInt(value);
  }
  / '#' value:[0-9]+ {
    return parseInt(value.join( ''));
  }

nonsense
  = ws* comment terminal 
  / ws+ terminal

comment
  = ';' [^\r\n]* {
    debug('comment');
  }

nl
  = [\r\n]+

ws
  = [ \t]

terminal =
  nl / eof

eof
  = !.
