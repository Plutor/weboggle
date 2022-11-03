#!/usr/bin/perl

use warnings;
use strict;
use lib qw( /home/www/htdocs/dev/boggle/cgi ); # XXX - Set correctly

use Boggle;
use Time::HiRes qw(time);

# ------------------------------------------------------------------------------

our $mostrecent = Boggle::getboard_offset(0);
our $lastgame = Boggle::getboard_offset(1);
our $now = time();

# If there was no game, or the most recent game is too old, make a new one
if (not defined $mostrecent->{endtime} or $now > $mostrecent->{endtime}) {
  my $newboardnum = ($mostrecent->{filename} || 0) + 1;

  $lastgame = $mostrecent;
  $mostrecent = Boggle::createnewboard( $newboardnum );
}

print "Cache-Control: no-cache\n";
print "Content-Type: text/html\n\n";

# If there is still no game, problem.
if (not defined $mostrecent->{endtime}) {
  warn "Unable to create new game for some reason!";

  # Crap, print something so that clients don't freak out
  print "60000\n\n\n";
}

# ------------------------------------------------------------------------------

our %x;
our %wordlist =   (defined $lastgame->{wordlist}) ? %{$lastgame->{wordlist}} : ();
our @foundwords = map { @{$wordlist{$_}} } keys %wordlist;
@foundwords = grep { not $x{$_}++ } @foundwords;

if ( $now <= $mostrecent->{starttime} ) {
  printf "%d\n", ($mostrecent->{starttime} - $now) * 1000;     # msec to starttime
  print "\n";                                                  # Board (left blank on purpose)
  print Boggle::totalscores($lastgame->{wordlist}) . "\n";     # Scores
  print join(",", @foundwords) . "\n";                         # Words
}
elsif ( $now <= $mostrecent->{endtime} ) {
  printf "%d\n", ($mostrecent->{endtime} - $now) * 1000;       # msec to endtime
  print $mostrecent->{letters} . "\n";                         # Board
  print Boggle::totalscores($lastgame->{wordlist}) . "\n";     # Scores
  print join(",", @foundwords) . "\n";                         # Words
}
else {
  # Uh, shit.  We should never get here.
  warn "Somehow we got to the end of getboard.cgi.";

  print "60000\n\n\n";
}
