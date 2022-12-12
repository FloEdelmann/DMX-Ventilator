/**** A P P L I C A T I O N   N O T E   ************************************
*
* Title			: 9ch DMX LED PWM-Dimmer
* Last updated          : 19.09.2006
* Target		: Transceiver Rev.3.01 [ATmega8515]
*
* written by hendrik hoelscher, www.hoelscher-hi.de
***************************************************************************
 This program is free software; you can redistribute it and/or 
 modify it under the terms of the GNU General Public License 
 as published by the Free Software Foundation; either version2 of 
 the License, or (at your option) any later version. 

 This program is distributed in the hope that it will be useful, 
 but WITHOUT ANY WARRANTY; without even the implied warranty of 
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 General Public License for more details. 

 If you have no copy of the GNU General Public License, write to the 
 Free Software Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA. 

 For other license models, please contact the author.

;***************************************************************************/

.include "m8515def.inc"

;Register and Pin definitions

.def tempL 				= r16
.def tempH				= r17
.def Flags				= r18
.def DMXstate			= r19
.def null				= r2
.def status				= r21
.def ind_count			= r3
.def blink				= r4
.def PwmCnt				= r20
.def SREGbuf			= r5
.def ChaseFine			= r6
.def ChaseRes			= r7

.equ StrobeFreqH		= 0x80
.equ StrobeFreqL		= 0x81
.equ StrobeBuf			= 0x82

.equ OldStepH			= 0x83
.equ OldStepL			= 0x84
.equ NewStepH			= 0x85
.equ NewStepL			= 0x86
.equ StepCnt			= 0x87
.equ ChaseCnt			= 0x88
.equ ChaseSeed			= 0x89

.equ LED1= PD7
.equ LED2= PE0
.equ BIT9= PE2

.equ DMX_FIELD=      0x60 		;SRAM-Beginn
.equ DMX_CHANNELS=   10
.equ PWM_FIELD=      0x70		
.equ F_OSC=          8000
.equ FLASH_DURATION= 400
.equ IND_OFFSET=     12	 	;Offset für indicator-Timer (14Hz)

#define CHS_SPD		 (0x600)
#define RATE         (0x500)
#define PAT0		 (0x400)
#define PAT1         (PAT0 +0xA)
#define PAT2		 (PAT1 +0xA)
#define PAT3		 (PAT2 +0xA)
#define PAT4		 (PAT3 +0xA)
#define PAT5         (PAT4 +0xA)
#define PAT6         (PAT5 +0xA)
#define PAT7         (PAT6 +0xA)


;***** special Flags

#define  VALID_DMX 	    (0)
#define  SIGNAL_COMING  (1)

#define  doIND			(5)
#define  BLACK_OUT		(6)
#define  DATA_REFRESHED (7)


;interrupt vectors
.org 0	
	rjmp init 		;reset vector address
	reti			;External Interrupt0 Vector Address
	reti			;External Interrupt1 Vector Address
	reti			;Input Capture1 Interrupt Vector Address
	rjmp strobe		;Output Compare1A Interrupt Vector Address
	reti			;Output Compare1B Interrupt Vector Address
	reti			;Overflow1 Interrupt Vector Address
	rjmp pwm		;Overflow0 Interrupt Vector Address
	reti			;SPI Interrupt Vector Address
	rjmp get_byte	;UART Receive Complete Interrupt Vector Address
	reti			;UART Data Register Empty Interrupt Vector Address
	reti			;UART Transmit Complete Interrupt Vector Address
	reti			;Analog Comparator Interrupt Vector Address
	reti			;External Interrupt2 Vector Address
	reti			;Output Compare0 Interrupt Vector Address
	reti			; EEPROM Interrupt Vector Address
	reti			; SPM complete Interrupt Vector Address
	reti			; SPM complete Interrupt Vector Address

; INIT

init:

; Stack
	ldi		tempH,high(RAMEND)
	ldi		tempL,low(RAMEND)
	out		SPH,tempH
	out		SPL,tempL

; WATCHDOG
	wdr
	ldi 	tempL, (1<<WDE)|(1<<WDCE)
	out 	WDTCR, tempL
	ldi 	tempL, (1<<WDE)|(1<<WDCE)|(1<<WDP2)|(1<<WDP1)
	out 	WDTCR, tempL
	wdr												;set prescaler @0,5s

; PortA
	ser 	tempL
	out 	DDRA, tempL
	clr 	tempL
	out 	PortA, tempL 							;low Outputs

; PortB
	ldi		tempL, 0b00000011
	out		DDRB, tempL
	ldi		tempL, 0b11110100
	out		PortB, tempL

; PortD
	ldi 	tempL, 0b10000100
	out 	DDRD, tempL
	ldi 	tempL, 0b01111000
	out 	PortD, tempL 							;DMX & Spare , LED1 on

; PortE
	ldi 	tempL, 0b00000001
	out 	DDRE, tempL
	ser		tempL
	out 	PortE, tempL 							;LED2 off, BIT9 & OPTION Pullup

; Timers
	ldi 	tempL, (1<<CS01)						;set counter0 @clock/8 frequency
	out 	TCCR0, tempL
	clr		tempL
	out		TCCR1A, tempL
	ldi 	tempL, (1<<CS12)|(1<<WGM12) 			;set counter1 @clock/256 frequency, CTCmode
	out 	TCCR1B, tempL
	ldi 	tempL, 	(1<<TOIE0)						;aktivate overflow interrupt
	out 	TIMSK, tempL
		
	rcall	init_dmx
	
	
; set Register
	clr null
	clr blink
	com blink
	mov	ChaseFine, blink
	ldi tempL, IND_OFFSET
	mov ind_count, tempL
	ldi PwmCnt, 0xFF
	ldi	Flags, 0									;clear Flags
	
	sts StepCnt, null
	sts	NewStepH, null
	sts NewStepL, null
	ldi	tempL, 1
	sts ChaseCnt, tempL
	sts ChaseSeed, tempL
	mov	ChaseRes, tempL		

	wdr
	sei

main: 	sbrc	Flags, doIND
		rcall	indicate

		rcall   eval_strobe_freq
;rcall chase
		rjmp	main



;****************************** LED INDICATOR ***********************************
indicate:
		cbr		Flags, (1<<doIND)	;clear flag
		rcall	chase
		dec		ind_count
		breq	ind_a
		ret
      
	  ind_a:
		wdr							;reset Watchdog
;working LED
		sbrc	Flags, DATA_REFRESHED	;should flash?
		rjmp	data_flash	
		sbi		PortE, LED2			; LED off

Error_LED:
		sbrc  	blink, 0			;wenn erstes bit HI
		rjmp  	on
		sbi   	PortD, LED1
		rjmp  	ind_tst
	 on:
	 	cbi  	PortD, LED1

     ind_tst:
	    lsr   	blink
		ldi		tempL, 1
		cp		blink, tempL
		brne	no_ind
	 		 	
;wenn durchrotiert (blink = 0)
		ldi		tempL, 0b10000000		
		sbrs 	Flags, VALID_DMX
		ldi	 	tempL, 0b10001010
		sbrs 	Flags, SIGNAL_COMING
		ldi	 	tempL, 0b10000010
		mov  	blink, tempL

		cbr 	Flags, (1<<VALID_DMX)|(1<<SIGNAL_COMING)
	
	no_ind:
		ldi		tempL, IND_OFFSET
		mov		ind_count, tempL		;plant prescaler
		ret
	data_flash:
		cbr		Flags, (1<<DATA_REFRESHED)
	    sbis 	PortE,LED2				;blinken grün
		rjmp 	off
		cbi		PortE,LED2
		rjmp 	Error_LED
		off:
		sbi 	PortE,LED2
		rjmp 	Error_LED 




;****************************** strobe frequency ***********************************
eval_strobe_freq:
		lds		tempL, DMX_FIELD					;get 1st DMX ch
		cpi		tempL, 246
		brlo	esf_1
		ldi		tempL, 245
       esf_1:
		lds		tempH, StrobeBuf
		cp		tempL, tempH
		brne	esf_2								;only eval if changed
		ret
	esf_2:
		sts		StrobeBuf, tempL
		cpi		tempL, 30
		brlo	esf_no_strobe
		cpi		tempL, 245
		brsh	esf_sync

		subi	tempL, 30							;0-200 allowed
		ldi		ZL, low(RATE*2)						;get freq from table
		ldi		ZH, high(RATE*2)
		add		ZL, tempL
		adc		ZH, null
		add		ZL, tempL
		adc		ZH, null
		lpm		tempL, Z+
		lpm		tempH, Z
		cli
		sts		StrobeFreqL, tempL					;atomic store
		sts		StrobeFreqH, tempH
		
		in		tempL, TIMSK
		sbr		tempL, (1<<OCIE1A)					;enable irq
		out		TIMSK, tempL
		in		tempL, TIFR
		sbr		tempL, (1<<OCF1A)					;enable irq
		out		TIFR, tempL
		reti	


	esf_no_strobe:
		in		tempL, TIMSK
		cbr		tempL, (1<<OCIE1A)					;disable irq
		out		TIMSK, tempL
		cbr		Flags, (1<<BLACK_OUT)				;enable pwm
		ret
	
	esf_sync:
		in		tempL, TIMSK
		sbrs	tempL, OCIE1A						;only when strobing
		ret
		cli
		sbr		Flags, (1<<BLACK_OUT)				;blank!
		lds		ZH, StrobeFreqH
		lds		ZL, StrobeFreqL
		out		OCR1AH, ZH
		out		OCR1AL, ZL
		sbiw	ZH:ZL, 20
		out		TCNT1H, ZH
		out		TCNT1L, ZL 		
		reti


;****************************** manual chaser mode ***********************************
chase:												;called by indicator
		sbis	PinE, PE1
		rjmp	chs_a
		sbic 	UCSRB,RXEN
		ret											;enable DMX reception
		sbi		UCSRB, RXEN
		clr		DMXstate
		ret

	chs_exit:
		sts		ChaseCnt, tempH
		ret

    chs_a:
		cbi		UCSRB,RXEN							;disable DMX
		sbr		Flags, (1<<VALID_DMX)|(1<<SIGNAL_COMING)
		lds		tempH, ChaseCnt						;load prescaler
		dec		tempH
		brne	chs_exit
		lds		tempL, ChaseSeed					;reseed prescaler
		sts		ChaseCnt, tempL

		add		ChaseFine, ChaseRes				;up-fade val
		adc		tempH, null							;(tempH was 0)
		mov		tempL, ChaseFine
		com		tempL								;down-fade val

		tst		tempH
		brne	chs_step
	  chs_step_ret:
		ldi		XL, low(DMX_FIELD +1)
		ldi 	XH, high(DMX_FIELD)
		ldi		ZL, 1
	   chase_fade:									;ch1..8
		clr		tempH
		lds		ZH, OldStepL
		and		ZH, ZL
		breq	cf_no_old
		mov		tempH, tempL
	   cf_no_old:
	    lds		ZH, NewStepL
		and		ZH, ZL
		breq	cf_no_new
        add		tempH, ChaseFine
       cf_no_new:
	    st		X+, tempH
		lsl		ZL
		brne	chase_fade
		
		clr		tempH								;9th ch
		lds		ZH, OldStepH
		sbrc	ZH, 0
		mov		tempH, tempL
		lds		ZH, NewStepH
		sbrc	ZH, 0
		add		tempH, ChaseFine
		st		X, tempH

		ret
		
		
	chs_step:
		sbr		Flags, (1<<DATA_REFRESHED)
		clr		ChaseFine							;reset fader
		ser		tempL

		lds		tempH, NewStepL						;change steps
		sts		OldStepL, tempH
		lds		tempH, NewStepH
		sts		OldStepH, tempH

		ldi		ZH, high(CHS_SPD*2)					;get speed
		in		ZL, PinC
		com		ZL
		swap	ZL
		andi	ZL, 0b00001111						;isolate pattern
		lpm		ZH, Z
		ldi		tempH, 1
		
		cpi		ZL, 5								;switch between resolution and prescale
		brsh	chs_decres
		mov		ChaseRes, tempH
		sts		ChaseSeed, ZH
		rjmp	chs_strb
       chs_decres:
	    mov		ChaseRes, ZH
		sts		ChaseSeed, tempH
	   chs_strb:

		clr		ZH									;add strobe
		sbis	PinE, PE2
		ldi		ZH,  220
		sts		DMX_FIELD, ZH

		ldi		ZH, high(PAT0*2)					;get next step
		lds		tempH, StepCnt
		mov		ZL, tempH
		lsl		ZL
		inc		tempH
		sts		StepCnt, tempH
		lpm		tempH, Z+
		sts		NewStepL, tempH
		lpm		tempH, Z
		sts		NewStepH, tempH
		
		sbrs	tempH, 1							;reset pattern?	
		rjmp	chs_step_ret
		
		in		ZL, PinC
		com		ZL
		andi	ZL, 0b00000111						;isolate pattern
		ldi		tempH, 10
		mul		ZL, tempH	
		sts		StepCnt, r0							;save pattern

		rjmp	chs_step_ret		
		
		
		
			


; ***************************9ch 8bitpwm-Ausgabe ****************************************
pwm:						
		in      SREGbuf, SREG
		push	tempL

	  	sbrc	Flags, BLACK_OUT					;blanked by strobe?
		rjmp	pwm_bo_exit
			
		lds		tempL, PWM_FIELD
		cp		tempL, PwmCnt
		ror		status
	  
	  	lds		tempL, (PWM_FIELD+1)
		cp		tempL, PwmCnt
		ror		status

	 	lds		tempL, (PWM_FIELD+2)
		cp		tempL, PwmCnt
		ror		status
		 	
		lds		tempL, (PWM_FIELD+3)
		cp		tempL, PwmCnt
		ror		status

		lds		tempL, (PWM_FIELD+4)
		cp		tempL, PwmCnt
		ror		status

	  	lds		tempL, (PWM_FIELD+5)
		cp		tempL, PwmCnt
		ror		status
	  	
		lds		tempL, (PWM_FIELD+6)
		cp		tempL, PwmCnt
		ror		status

	  	lds		tempL, (PWM_FIELD+7)
		cp		tempL, PwmCnt
		ror		status
												    ;9th bit
	   	sbis	PinD, PD4							;invert option
  		rjmp	pwm9_pos							; no invert
		
		lds		tempL, (PWM_FIELD+8)
		sbi		PortB, 0
		cp		tempL, PwmCnt
		brlo	pwm_exit
		cbi		PortB, 0
		rjmp	pwm_exit

	   pwm9_pos:
	    com		status
	  	lds		tempL, (PWM_FIELD+8)
		cbi		PortB, 0
		cp		tempL, PwmCnt
		brlo	pwm_exit
		sbi		PortB, 0
		rjmp	pwm_exit

	pwm_bo_exit:
		sbis	PinD, PD4							;invert option
  		rjmp	pwm_bo_pos							; no invert
		ser		status								;all ch off (inverted)
		sbi		PortB, 0
		rjmp	pwm_exit
	   pwm_bo_pos:
	   	clr		status								;all ch off
		cbi		PortB, 0	

	pwm_exit:
		out		PortA, status						;output
		mov		tempL, PwmCnt						;set next compare time
		lsr		tempL
		lsr		tempL
		lsr		tempL
		ldi		status, 250
		sub		status, tempL
		out		TCNT0, status

		inc		PwmCnt
		tst		PwmCnt
		brne	pwm_no_reload
		lds		tempL, (DMX_FIELD+1)				;refresh channels
		sts		PWM_FIELD, tempL
		lds		tempL, (DMX_FIELD+2)
		sts		(PWM_FIELD+1), tempL
		lds		tempL, (DMX_FIELD+3)
		sts		(PWM_FIELD+2), tempL
		lds		tempL, (DMX_FIELD+4)
		sts		(PWM_FIELD+3), tempL
		lds		tempL, (DMX_FIELD+5)
		sts		(PWM_FIELD+4), tempL
		lds		tempL, (DMX_FIELD+6)
		sts		(PWM_FIELD+5), tempL
		lds		tempL, (DMX_FIELD+7)
		sts		(PWM_FIELD+6), tempL
		lds		tempL, (DMX_FIELD+8)
		sts		(PWM_FIELD+7), tempL
		lds		tempL, (DMX_FIELD+9)
		sts		(PWM_FIELD+8), tempL
		ldi		PwmCnt, 1							;reseed counter
		sbr		Flags, (1<<doIND)					;indicate in main
	  
	  pwm_no_reload:
	  	pop		tempL
		out     SREG, SREGbuf
		reti



; ***************************Strobo function ****************************************
strobe:	
		in      SREGbuf, SREG
		push	tempL
		push	tempH

		sbrs	Flags, BLACK_OUT
		rjmp	str_blank
		cbr		Flags, (1<<BLACK_OUT)				;enable pwm
		ldi		tempL,  low(FLASH_DURATION)			;load flash time
		ldi		tempH, high(FLASH_DURATION)
		rjmp	str_exit

	str_blank:
		sbr		Flags, (1<<BLACK_OUT)
		lds		tempL, StrobeFreqL
		lds		tempH, StrobeFreqH

	str_exit:
		out		OCR1AH, tempH
		out		OCR1AL, tempL
		pop		tempH
		pop		tempL
		out     SREG, SREGbuf
		reti	


.include "lib_dmx_in.asm"

nix: rjmp nix

// Strobo frequency table (damped logarithmic)
.org RATE
.dw 65532, 60407, 56368, 53017, 50170, 47708, 45546, 43626, 41904, 40345, 38925, 37623, 36423, 35311, 34277, 33311 
.dw 32406, 31555, 30753, 29996, 29278, 28596, 27948, 27331, 26741, 26177, 25637, 25120, 24623, 24145, 23685, 23242 
.dw 22814, 22402, 22003, 21617, 21244, 20882, 20531, 20191, 19861, 19540, 19228, 18924, 18629, 18341, 18061, 17788 
.dw 17521, 17261, 17007, 16760, 16517, 16281, 16049, 15823, 15601, 15384, 15172, 14964, 14760, 14560, 14364, 14172 
.dw 13983, 13798, 13617, 13438, 13263, 13091, 12922, 12756, 12593, 12432, 12274, 12119, 11966, 11815, 11667, 11522 
.dw 11378, 11237, 11098, 10960, 10825, 10692, 10561, 10431, 10304, 10178, 10054, 9931,  9811,  9691,  9574,  9458 
.dw 9343,  9230,  9119,  9008,  8899,  8792,  8686,  8581,  8477,  8375,  8273,  8173,  8074,  7976,  7880,  7784 
.dw 7690,  7596,  7504,  7412,  7322,  7232,  7144,  7056,  6969,  6884,  6799,  6715,  6631,  6549,  6467,  6387 
.dw 6307,  6227,  6149,  6071,  5994,  5918,  5843,  5768,  5694,  5620,  5548,  5475,  5404,  5333,  5263,  5193 
.dw 5125,  5056,  4988,  4921,  4855,  4789,  4723,  4658,  4594,  4530,  4466,  4404,  4341,  4279,  4218,  4157 
.dw 4097,  4037,  3978,  3919,  3860,  3802,  3744,  3687,  3631,  3574,  3518,  3463,  3408,  3353,  3299,  3245
.dw 3191,  3138,  3085,  3033,  2981,  2929,  2878,  2827,  2777,  2726,  2677,  2627,  2578,  2529,  2480,  2432
.dw 2384,  2337,  2289,  2242,  2196,  2149,  2103,  2057,  2012,  1967,  1922,  1877,  1833,  1789,  1745,  1701 
.dw 1658,  1615,  1572,  1530,  1488,  1446,  1350,  1250,  1100,  1050,  1000,  950,   900,   850,   800,   750
.dw 700,   650,   600,   550,   500,   450,   400,   350,   300,   250,   200,   150


.org PAT0					;on
.dw 0b0111111111
.dw 0b1111111111

.org PAT1					;Lauflicht
.dw 0b0000000001
.dw 0b0000000010
.dw 0b0000000100
.dw 0b0000001000
.dw 0b0000010000
.dw 0b0000100000
.dw 0b0001000000
.dw 0b0010000000
.dw 0b1100000000

.org PAT2					;ping pong
.dw 0b0000010000
.dw 0b0000100000
.dw 0b0000001000
.dw 0b0001000000
.dw 0b0000000100
.dw 0b0010000000
.dw 0b0000000010
.dw 0b0100000000 
.dw 0b1000000001

.org PAT3					;ping pong
.dw 0b0000011000
.dw 0b0000100100
.dw 0b0001000010
.dw 0b1010000001

.org PAT4					;pfeil
.dw 0b0000011000
.dw 0b0000111100
.dw 0b0001111110
.dw 0b0011111111
.dw 0b0011100111
.dw 0b0011000011
.dw 0b1010000001

.org PAT5					;RGB
.dw 0b0001001001
.dw 0b0011011011
.dw 0b0010010010
.dw 0b0110110110
.dw 0b0100100100
.dw 0b1101101101

.org PAT6					;RGB spread
.dw 0b0100010001
.dw 0b0101110011
.dw 0b0001100010
.dw 0b0011101110
.dw 0b0010001100
.dw 0b1110011101

.org PAT7
.dw 0b0001001001			;RGB single change
.dw 0b0001001011
.dw 0b0001011011
.dw 0b0011011011
.dw 0b0011011010
.dw 0b0011010010
.dw 0b0010010010
.dw 0b0010010110
.dw 0b0010110110
.dw 0b0110110110
.dw 0b0110110100
.dw 0b0110100100
.dw 0b0100100100
.dw 0b0100100101
.dw 0b0100101101
.dw 0b0101101101
.dw 0b0101101001
.dw 0b1101001001


.org CHS_SPD
.db 25, 10, 3, 2, 1, 2, 3, 5, 8, 12, 17, 22, 27, 35, 40, 48



