; print binary code
Start: 
 ; where to print
 LDX #$A000 

 ; a byte consists of eight bits
 LDY #8

 ; 0
 LDA #48

 ;target
 LDB #$81

Loop1: 
 ; test one bit
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