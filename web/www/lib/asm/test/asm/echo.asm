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