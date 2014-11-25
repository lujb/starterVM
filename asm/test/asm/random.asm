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