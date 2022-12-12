file = LED.hex

all: $(file)
	avrdude -p atmega8515 -c usbasp -B 3 -U flash:w:$(file)

%.hex: %.asm
	avra -I "/usr/share/avra" $*.asm

fuse:
	avrdude -p atmega8515 -c usbasp -B 3 -U lfuse:w:0x3f:m -U hfuse:w:0x9d:m

test:
	avrdude -p atmega8515 -c usbasp -B 3 -U flash:w:board.hex