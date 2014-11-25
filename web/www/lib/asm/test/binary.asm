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