; print while you type.
; make sure your screen is focused when running this program
START:
  LDX :#0
  LDY #$A000
  STY, X

LOOP: 
  ; delay 30 milliseconds
  LDX #30
  INT #2

  ; get one value from input buff
  INT #4

  ; if failed to get
  CMPB #0
  ; then try again
  JEQ #LOOP

  ; else print it onto scrren
  LDX [:#0]
  STB, X
  LDY [:#0]
  INCY
  INCY
  LDX :#0
  STY, X

  ; loop
  JMP #LOOP

  END START