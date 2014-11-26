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