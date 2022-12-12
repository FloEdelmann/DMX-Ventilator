// see http://proton.ucting.udg.mx/tutorial/AVR/

var categories = ['Arithmetische und Logische Anweisungen', 'Verzweigungsanweisungen', 'Datentransfer-Anweisungen', 'Bit- und Bit-Test-Anweisungen'];

var commands = {
  // Mnemonic: [Operands, Name (de), Name (en), Description (de), Operation, Flags, Cycles, Category]

  'add': ['Rd, Rr', '', 'Add without Carry', '', 'Rd = Rd + Rr', 'Z, C, N, V, H, S', '1', 0],
  'adc': ['Rd, Rr', '', 'Add with Carry', '', 'Rd = Rd + Rr + C', 'Z, C, N, V, H, S', '1', 0],
  'sub': ['Rd, Rr', '', 'Subtract without Carry', '', 'Rd = Rd - Rr', 'Z, C, N, V, H, S', '1', 0],
  'subi': ['Rd, K8', '', 'Subtract Immediate', '', 'Rd = Rd - K8', 'Z, C, N, V, H, S', '1', 0],
  'sbc': ['Rd, Rr', '', 'Subtract with Carry', '', 'Rd = Rd - Rr - C', 'Z, C, N, V, H, S', '1', 0],
  'sbci': ['Rd, K8', '', 'Subtract with Carry Immedtiate', '', 'Rd = Rd - K8 - C', 'Z, C, N, V, H, S', '1', 0],
  'and': ['Rd, Rr', '', 'Logical AND', '', 'Rd = Rd &middot; Rr', 'Z, N, V, S&nbsp;', '1', 0],
  'andi': ['Rd, K8', '', 'Logical AND with Immediate', '', 'Rd = Rd &middot; K8', 'Z, N, V, S', '1', 0],
  'or': ['Rd, Rr', '', 'Logical OR', '', 'Rd = Rd V Rr', 'Z, N, V, S', '1', 0],
  'ori': ['Rd, K8', '', 'Logical OR with Immediate', '', 'Rd = Rd V K8', 'Z, N, V, S', '1', 0],
  'eor': ['Rd, Rr', 'Logisches Exklusiv-ODER', 'Logical Exclusive OR', 'Wie ODER, zwei Einsen werden allerdings zur Null. Beispiel:<br /><code>&nbsp;&nbsp;01101010<br />^&nbsp;00100110<br />=&nbsp;01001100</code>', 'Rd = Rd EOR Rr', 'Z, N, V, S', '1', 0],
  'com': ['Rd', '', 'One\'s Complement', '', 'Rd = $FF - Rd', 'Z, C, N, V, S', '1', 0],
  'neg': ['Rd', '', 'Two\'s Complement', '', 'Rd = $00 - Rd', 'Z, C, N, V, H, S', '1', 0],
  'sbr': ['Rd, K8', '', 'Set Bit(s) in Register', '', 'Rd = Rd V K8', 'Z, C, N, V, S', '1', 0],
  'cbr': ['Rd, K8', '', 'Clear Bit(s) in Register', '', 'Rd = Rd &middot; ($FF -K8)', 'Z, C, N, V, S', '1', 0],
  'inc': ['Rd', 'Register inkrementieren', 'Increment Register', 'Zum Inhalt des Registers Eins dazuzählen', 'Rd = Rd + 1', 'Z, N, V, S', '1', 0],
  'dec': ['Rd', 'Register dekrementieren', 'Decrement Register', 'Vom Inhalt des Registers Eins abziehen', 'Rd = Rd -1', 'Z, N, V, S', '1', 0],
  'tst': ['Rd', 'Auf Null oder Negativ prüfen', 'Test for Zero or Negative', 'Setzt das {Zero}-Flag, wenn der Register null oder negativ ist', 'Rd = Rd &middot; Rd', 'Z, C, N, V, S', '1', 0],
  'clr': ['Rd', '', 'Clear Register', '', 'Rd = 0', 'Z, C, N, V, S', '1', 0],
  'ser': ['Rd', '', 'Set Register', '', 'Rd = $FF', 'Keine', '1', 0],
  'adiw': ['Rdl, K6', '', 'Add Immediate to Word', '', 'Rdh:Rdl = Rdh:Rdl + K6&nbsp;', 'Z, C, N, V, S', '2', 0],
  'sbiw': ['Rdl, K6', '', 'Subtract Immediate from Word', '', 'Rdh:Rdl = Rdh:Rdl - K 6', 'Z, C, N, V, S', '2', 0],
  'mul': ['Rd, Rr', '', 'Multiply Unsigned', '', 'R1:R0 = Rd * Rr', 'Z, C', '2', 0],
  'muls': ['Rd, Rr', '', 'Multiply Signed', '', 'R1:R0 = Rd * Rr', 'Z, C', '2', 0],
  'mulsu': ['Rd, Rr', '', 'Multiply Signed with Unsigned', '', 'R1:R0 = Rd * Rr', 'Z, C', '2', 0],
  'fmul': ['Rd, Rr', '', 'Fractional Multiply Unsigned', '', 'R1:R0 = (Rd * Rr) &lt;&lt;1', 'Z, C', '2', 0],
  'fmuls': ['Rd, Rr', '', 'Fractional Multiply Signed', '', 'R1:R0 = (Rd * Rr) &lt;&lt;1', 'Z, C', '2', 0],
  'fmulsu': ['Rd, Rr', '', 'Fractional Multiply Signed with Unsigned', '', 'R1:R0 = (Rd * Rr) &lt;&lt;1', 'Z, C', '2', 0],
  
  'rjmp': ['k', 'Relativer Sprung', 'Relative Jump', '', 'PC = PC + k +1', 'Keine', '2', 1],
  'ijmp': ['Keine', '', 'Indirect Jump to (Z)', '', 'PC = Z', 'Keine', '2', 1],
  'eijmp': ['Keine', '', 'Extended Indirect Jump (Z)', '', 'STACK = PC+1, PC(15:0) =Z, PC(21:16) = EIND', 'Keine', '2', 1],
  'jmp': ['k', 'Sprung', 'Jump', '', 'PC = k', 'Keine', '3', 1],
  'rcall': ['k', 'Relativer Aufruf einer Subroutine', 'Relative Call Subroutine', '', 'STACK = PC+1, PC = PC +k + 1', 'Keine', '3 / 4', 1],
  'icall': ['Keine', '', 'Indirect Call to (Z)', '', 'STACK = PC+1, PC = Z', 'Keine', '3 / 4', 1],
  'eicall': ['Keine', '', 'Extended Indirect Call to(Z)', '', 'STACK = PC+1, PC(15:0) =Z, PC(21:16) =EIND', 'Keine', '4', 1],
  'call': ['k', '', 'Call Subroutine', '', 'STACK = PC+2, PC = k', 'Keine', '4 / 5', 1],
  'ret': ['Keine', 'Rücksprung aus Subroutine', 'Subroutine Return', 'Kehrt zum Aufrufpunkt der Subroutine zurück', 'PC = STACK', 'Keine', '4 / 5', 1],
  'reti': ['Keine', 'Rücksprung aus Interrupthandler', 'Interrupt Return', 'Beendet den Interrupthandler und aktiviert wieder alle Interrupts', 'PC = STACK', 'I', '4 / 5', 1],
  'cpse': ['Rd, Rr', '', 'Compare, Skip if equal', '', 'if (Rd ==Rr) PC = PC 2 or3', 'Keine', '1 / 2 / 3', 1],
  'cp': ['Rd, Rr', 'Vergleiche', 'Compare', '', 'Rd - Rr', 'Z, C, N, V, H, S', '1', 1],
  'cpc': ['Rd, Rr', '', 'Compare with Carry', '', 'Rd - Rr - C', 'Z, C, N, V, H, S', '1', 1],
  'cpi': ['Rd, K8', '', 'Compare with Immediate', '', 'Rd - K', 'Z, C, N, V, H, S', '1', 1],
  'sbrc': ['Rr, b', 'Überspringen, wenn Bit in Register nicht gesetzt', 'Skip if bit in register cleared', 'Überspringt den nächsten Befehl, wenn das Bit nicht gesetzt ist', 'if(Rr(b)==0) PC = PC + 2or 3', 'Keine', '1 / 2 / 3', 1],
  'sbrs': ['Rr, b', 'Überspringen, wenn Bit in Register gesetzt', 'Skip if bit in register set', 'Überspringt den nächsten Befehl, wenn das Bit gesetzt ist', 'if(Rr(b)==1) PC = PC + 2or 3', 'Keine', '1 / 2 / 3', 1],
  'sbic': ['P, b', 'Überspringen, wenn Bit in I/O-Register nicht gesetzt', 'Skip if bit in I/O register cleared', 'Überspringt den nächsten Befehl, wenn das Bit nicht gesetzt ist', 'if(I/O(P, b)==0) PC = PC+ 2 or 3', 'Keine', '1 / 2 / 3', 1],
  'sbis': ['P, b', 'Überspringen, wenn Bit in I/O-Register gesetzt', 'Skip if bit in I/O register set', 'Überspringt den nächsten Befehl, wenn das Bit gesetzt ist', 'if(I/O(P, b)==1) PC = PC+ 2 or 3', 'Keine', '1 / 2 / 3', 1],
  'brbc': ['s, k', 'Verzweige, wenn {Status}-Flag nicht gesetzt', 'Branch if Status flag cleared', '', 'if(SREG(s)==0) PC = PC +k + 1', 'Keine', '1 / 2', 1],
  'brbs': ['s, k', 'Verzweige, wenn {Status}-Flag gesetzt', 'Branch if Status flag set', '', 'if(SREG(s)==1) PC = PC +k + 1', 'Keine', '1 / 2', 1],
  'breq': ['k', 'Verzweige, wenn gleich', 'Branch if equal', 'Verzweigt, wenn das {Z}-Bit gesetzt ist', 'if(Z==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brne': ['k', 'Verzweige, wenn nicht gleich', 'Branch if not equal', 'Verzweigt, wenn das {Z}-Bit nicht gesetzt ist', 'if(Z==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brcs': ['k', 'Verzweige, wenn {Carry}-Flag gesetzt', 'Branch if carry set', '', 'if(C==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brcc': ['k', 'Verzweige, wenn {Carry}-Flag nicht gesetzt', 'Branch if carry cleared', '', 'if(C==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brsh': ['k', '', 'Branch if same or higher', '', 'if(C==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brlo': ['k', '', 'Branch if lower', '', 'if(C==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brmi': ['k', '', 'Branch if minus', '', 'if(N==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brpl': ['k', '', 'Branch if plus', '', 'if(N==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brge': ['k', '', 'Branch if greater than or equal (signed)', '', 'if(S==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brlt': ['k', '', 'Branch if less than (signed)', '', 'if(S==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brhs': ['k', '', 'Branch if half carry flagset', '', 'if(H==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brhc': ['k', '', 'Branch if half carry flag cleared', '', 'if(H==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brts': ['k', '', 'Branch if T flag set', '', 'if(T==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brtc': ['k', '', 'Branch if T flag cleared', '', 'if(T==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brvs': ['k', '', 'Branch if overflow flagset', '', 'if(V==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brvc': ['k', '', 'Branch if overflow flag cleared', '', 'if(V==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brie': ['k', '', 'Branch if interrupt enabled', '', 'if(I==1) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  'brid': ['k', '', 'Branch if interrupt disabled', '', 'if(I==0) PC = PC + k + 1', 'Keine', '1 / 2', 1],
  
  'mov': ['Rd, Rr', 'Register kopieren', 'Copy register', 'Lädt den Inhalt von Rr in Rd', 'Rd = Rr', 'Keine', '1', 2],
  'movw': ['Rd, Rr', '', 'Copy register pair', '', 'Rd+1:Rd = Rr+1:Rr, r, d even', 'Keine', '1', 2],
  'ldi': ['Rd, K8', 'Sofortiges Laden', 'Load Immediate', 'Lädt ein Bitmuster in ein Register', 'Rd = K', 'Keine', '1', 2],
  'lds': ['Rd, k', '', 'Load Direct', '', 'Rd = (k)', 'Keine', '2', 2],
  'ld': ['Rd, X', '', 'Load Indirect', '', 'Rd = (X)', 'Keine', '2', 2],
  'ld': ['Rd, X+', '', 'Load Indirect and Post-Increment', '', 'Rd = (X), X=X+1', 'Keine', '2', 2],
  'ld': ['Rd, -X', '', 'Load Indirect and Pre-Decrement', '', 'X=X-1, Rd = (X)', 'Keine', '2', 2],
  'ld': ['Rd, Y', '', 'Load Indirect', '', 'Rd = (Y)', 'Keine', '2', 2],
  'ld': ['Rd, Y+', '', 'Load Indirect and Post-Increment', '', 'Rd = (Y), Y=Y+1', 'Keine', '2', 2],
  'ld': ['Rd, -Y', '', 'Load Indirect and Pre-Decrement', '', 'Y=Y-1, Rd = (Y)', 'Keine', '2', 2],
  'ldd': ['Rd, Y+, q', '', 'Load Indirect with displacement', '', 'Rd = (Y+q)', 'Keine', '2', 2],
  'ld': ['Rd, Z', '', 'Load Indirect', '', 'Rd = (Z)', 'Keine', '2', 2],
  'ld': ['Rd, Z+', '', 'Load Indirect and Post-Increment', '', 'Rd = (Z), Z=Z+1', 'Keine', '2', 2],
  'ld': ['Rd, -Z', '', 'Load Indirect and Pre-Decrement', '', 'Z=Z-1, Rd = (Z)', 'Keine', '2', 2],
  'ldd': ['Rd, Z+, q', '', 'Load Indirect with displacement', '', 'Rd = (Z+q)', 'Keine', '2', 2],
  'sts': ['k, Rr', '', 'Store Direct', '', '(k) = Rr', 'Keine', '2', 2],
  'st': ['X, Rr', '', 'Store Indirect', '', '(X) = Rr', 'Keine', '2', 2],
  'st': ['X+, Rr', '', 'Store Indirect and Post-Increment', '', '(X) = Rr, X=X+1', 'Keine', '2', 2],
  'st': ['-X, Rr', '', 'Store Indirect and Pre-Decrement', '', 'X=X-1, (X)=Rr', 'Keine', '2', 2],
  'st': ['Y, Rr', '', 'Store Indirect', '', '(Y) = Rr', 'Keine', '2', 2],
  'st': ['Y+, Rr', '', 'Store Indirect and Post-Increment', '', '(Y) = Rr, Y=Y+1', 'Keine', '2', 2],
  'st': ['-Y, Rr', '', 'Store Indirect and Pre-Decrement', '', 'Y=Y-1, (Y) = Rr', 'Keine', '2', 2],
  'st': ['Y+, q, Rr', '', 'Store Indirect with displacement', '', '(Y+q) = Rr', 'Keine', '2', 2],
  'st': ['Z, Rr', '', 'Store Indirect', '', '(Z) = Rr', 'Keine', '2', 2],
  'st': ['Z+, Rr', '', 'Store Indirect and Post-Increment', '', '(Z) = Rr, Z=Z+1', 'Keine', '2', 2],
  'st': ['-Z, Rr', '', 'Store Indirect and Pre-Decrement', '', 'Z=Z-1, (Z) = Rr', 'Keine', '2', 2],
  'st': ['Z+, q, Rr', '', 'Store Indirect with displacement', '', '(Z+q) = Rr', 'Keine', '2', 2],
  'lpm': ['Keine', '', 'Load Program Memory', '', 'R0 = (Z)', 'Keine', '3', 2],
  'lpm': ['Rd, Z', '', 'Load Program Memory', '', 'Rd = (Z)', 'Keine', '3', 2],
  'lpm': ['Rd, Z+', '', 'Load Program Memory and Post-Increment', '', 'Rd = (Z),Z=Z+1', 'Keine', '3', 2],
  'elpm': ['Keine', '', 'Extended Load Program Memory', '', 'R0 = (RAMPZ: Z)', 'Keine', '3', 2],
  'elpm': ['Rd, Z', '', 'Extended Load Program Memory', '', 'Rd = (RAMPZ: Z)', 'Keine', '3', 2],
  'elpm': ['Rd, Z+', '', 'Extended Load Program Memory and Post Increment', '', 'Rd = (RAMPZ: Z),Z = Z+1', 'Keine', '3', 2],
  'spm': ['Keine', '', 'Store Program Memory', '', '(Z)= R1:R0', 'Keine', '-', 2],
  'espm': ['Keine', '', 'Extended Store Program Memory', '', '(RAMPZ: Z)= R1:R0', 'Keine', '-', 2],
  'in': ['Rd, P', 'Rein', 'In Port', 'Liest den Port in das Register ein', 'Rd = P', 'Keine', '1', 2],
  'out': ['P, Rr', 'Raus', 'Out Port', 'Schreibt den Registerinhalt in den Port', 'P = Rr', 'Keine', '1', 2],
  'push': ['Rr', 'Register im Stack speichern', 'Push register on Stack', '', 'STACK = Rr', 'Keine', '2', 2],
  'pop': ['Rd', 'Register aus Stack laden', 'Pop register from Stack', '', 'Rd = STACK', 'Keine', '2', 2],
  
  'lsl': ['Rd', '', 'Logical shift left', '', 'Rd(n+1)=Rd(n), Rd(0)=0, C=Rd(7)', 'Z, C, N, V, H, S', '1', 3],
  'lsr': ['Rd', '', 'Logical shift right', '', 'Rd(n)=Rd(n+1), Rd(7)=0, C=Rd(0)', 'Z, C, N, V, S', '1', 3],
  'rol': ['Rd', 'Linksherum rotieren', 'Rotate left through carry', 'Schiebt alle Bits nach links. Das siebte Bit (ganz links) wird ins {Carry}-Flag geschoben', 'Rd(0)=C, Rd(n+1)=Rd(n),C=Rd(7)', 'Z, C, N, V, H, S', '1', 3],
  'ror': ['Rd', 'Rechtsherum rotieren', 'Rotate right through carry', 'Schiebt alle Bits nach rechts. Das nullte Bit (ganz rechts) wird ins {Carry}-Flag geschoben', 'Rd(7)=C, Rd(n)=Rd(n+1),C=Rd(0)', 'Z, C, N, V, S', '1', 3],
  'asr': ['Rd', '', 'Arithmetic shift right', '', 'Rd(n)=Rd(n+1), n=0,...,6', 'Z, C, N, V, S', '1', 3],
  'swap': ['Rd', '', 'Swap nibbles', '', 'Rd(3..0) = Rd(7..4), Rd(7..4)= Rd(3..0)', 'Keine', '1', 3],
  'bset': ['s', '', 'Set flag', '', 'SREG(s) = 1', 'SREG(s)', '1', 3],
  'bclr': ['s', '', 'Clear flag', '', 'SREG(s) = 0', 'SREG(s)', '1', 3],
  'sbi': ['P, b', 'Bit in I/O-Register setzen', 'Set bit in I/O register', '', 'I/O(P, b) = 1', 'Keine', '2', 3],
  'cbi': ['P, b', 'Bit in I/O-Register löschen', 'Clear bit in I/O register', '', 'I/O(P, b) = 0', 'Keine', '2', 3],
  'bst': ['Rr, b', '', 'Bit store from register to T', '', 'T = Rr(b)', 'T', '1', 3],
  'bld': ['Rd, b', '', 'Bit load from register to T', '', 'Rd(b) = T', 'Keine', '1', 3],
  'sec': ['Keine', '', 'Set carry flag', '', 'C =1', 'C', '1', 3],
  'clc': ['Keine', '', 'Clear carry flag', '', 'C = 0', 'C', '1', 3],
  'sen': ['Keine', '', 'Set negative flag', '', 'N = 1', 'N', '1', 3],
  'cln': ['Keine', '', 'Clear negative flag', '', 'N = 0', 'N', '1', 3],
  'sez': ['Keine', '', 'Set zero flag', '', 'Z = 1', 'Z', '1', 3],
  'clz': ['Keine', '', 'Clear zero flag', '', 'Z = 0', 'Z', '1', 3],
  'sei': ['Keine', 'Interrupt-Flag setzen', 'Set interrupt flag', 'Aktiviert alle Interrupts', 'I = 1', 'I', '1', 3],
  'cli': ['Keine', 'Interrupt-Flag löschen', 'Clear interrupt flag', 'Deaktiviert alle Interrupts', 'I = 0', 'I', '1', 3],
  'ses': ['Keine', '', 'Set signed flag', '', 'S = 1', 'S', '1', 3],
  'cln': ['Keine', '', 'Clear signed flag', '', 'S = 0', 'S', '1', 3],
  'sev': ['Keine', '', 'Set overflow flag', '', 'V = 1', 'V', '1', 3],
  'clv': ['Keine', '', 'Clear overflow flag', '', 'V = 0', 'V', '1', 3],
  'set': ['Keine', '', 'Set T-flag', '', 'T = 1', 'T', '1', 3],
  'clt': ['Keine', '', 'Clear T-flag', '', 'T = 0', 'T', '1', 3],
  'seh': ['Keine', '', 'Set half carry flag', '', 'H = 1', 'H', '1', 3],
  'clh': ['Keine', '', 'Clear half carry flag', '', 'H = 0', 'H', '1', 3],
  'nop': ['Keine', '', 'No operation', '', 'Keine', 'Keine', '1', 3],
  'sleep': ['Keine', '', 'Sleep', '', 'See instruction manual', 'Keine', '1', 3],
  'wdr': ['Keine', '', 'Watchdog Reset', '', 'See instruction manual', 'Keine', '1', 3]
};

var directives = {
  // directive: [short description, longer description]
  '.byte': ['Byte für eine Variable reservieren', ''],
  '.cseg': ['Code-Segment', ''],
  '.db': ['Konstante(s) Byte(s) definieren', ''],
  '.def': ['Symbolischen Namen für ein Register definieren', ''],
  '.device': ['Gerät, für das assembliert werden soll, definieren', ''],
  '.dseg': ['Daten-Segment', ''],
  '.dw': ['Konstante(s) Wort(e) definieren', ''],
  '.endm': ['Ende des Makros', ''],
  '.endmacro': ['Ende des Makros', ''],
  '.equ': ['Symbol einem Ausdruck gleichsetzen', 'kann später nicht mehr geändert werden'],
  '.eseg': ['EEPROM-Segment', ''],
  '.exit': ['Datei verlassen', ''],
  '.include': ['Code einer anderen Datei importieren', ''],
  '.list': ['Listfile-Generierung aktivieren', ''],
  '.listmac': ['Makro-Erweiterung im Listfile aktivieren', ''],
  '.nolist': ['Listfile-Generierung deaktivieren', ''],
  '.org': ['Programmursprung setzen', ''],
  '.set': ['Symbol einem Ausdruck gleichsetzen', 'kann später geändert werden']
};

function searchCommand() {
  var $output = document.querySelector('#asm-help-output');
  var cmd = this.value;

  if (cmd == '') {
    $output.innerHTML = '<p>Bitte Assembler-Kommando oder Direktive eingeben.</p>';
  }
  else if (cmd.indexOf('.') == 0) {
    if (directives[cmd]) {
      $output.innerHTML = '<strong><code>' + cmd + '</code> ' + directives[cmd][0] + '</strong>' + (directives[cmd][1] !== '' ? '<br />' + directives[cmd][1] : '');
    }
    else {
      $output.innerHTML = 'Direktive <code>' + cmd + '</code> nicht gefunden.';
    }
  }
  else if (commands[cmd]) {
    var desc = (commands[cmd][1] == '') ? commands[cmd][3] : commands[cmd][1] + '. ' + commands[cmd][3];
    var cycles = commands[cmd][6];
    cycles += (cycles == 1) ? ' Zyklus' : ' Zyklen';

    $output.innerHTML = '<strong><code>' + cmd + '</code> ' + commands[cmd][2] + '</strong><br />' + desc + '<br /><em>Operanden:</em> ' + commands[cmd][0] + '<br/><em>Veränderte Flags:</em> ' + commands[cmd][5] + '<br/>' + cycles + '<br /><em>Operation:</em> <code>' + commands[cmd][4] + '</code>';
  }
  else {
    $output.innerHTML = 'Kommando <code>' + cmd + '</code> nicht gefunden.';
  }
}

(function() {
  var $input = document.querySelector('#asm-help-input');

  $input.addEventListener('keyup', searchCommand, false);
  $input.addEventListener('change', searchCommand, false);

  searchCommand.call($input);
})();
