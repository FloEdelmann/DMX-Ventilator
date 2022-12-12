#!/usr/bin/perl -w

use strict;

my $in = 115;
my $out = 255;

print ".db ";

for (0 .. $in) {
    my $val = int($_ * $out/$in);
    if (($_+1) % 10 == 0) {
        print $val . "\n.db "
    }
    else {
        print $val . ", ";
    }
}