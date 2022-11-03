#!/usr/bin/perl

use warnings;
use strict;
use lib qw( /home/www/htdocs/dev/boggle/cgi ); # XXX - Set correctly

use Boggle;
use Time::HiRes qw(time);

# ------------------------------------------------------------------------------

our $mostrecent = Boggle::getboard_offset();
our $now = time();

our $word = $ENV{QUERY_STRING} || "";
$word =~ s/[^a-z]//ig;

our ($name) = (($ENV{HTTP_COOKIE} || "name=") =~ /name=([^;]*)/i);
$name =~ s/[\n\s]+/ /g;
$name =~ s/[,=]//g;

#print STDERR "$ENV{HTTP_COOKIE} $name\n";

print "Cache-Control: no-cache\n";
print "Content-Type: text/html\n\n";

# ------------------------------------------------------------------------------

# If there is no game do nothing
if (not defined $mostrecent->{endtime}) {
  print "Fatal error";
  exit;
}

if (not defined $name or $name eq "") {
  print "No name";
  exit;
}
if (not defined $word or $word eq "") {
  print "No word";
  exit;
}

# If the most recent game hasn't started yet, see if there's one just finished.
if ($now < $mostrecent->{starttime} ) {
  $mostrecent = Boggle::getboard_offset(1);
  exit if (not defined $mostrecent->{endtime} or $now > $mostrecent->{endtime} + Boggle::GRACEPERIOD);
}

# ------------------------------------------------------------------------------
# Add word to list if:
#  1) Word is long enough
#  2) Word hasn't already been found
#  3) Word is in dictionary
#     (We can check to see if it's in another player's list before going to dict)
#  4) Word is on the board

our $error = undef;

our %wordlist =   (defined $mostrecent->{wordlist}) ? %{$mostrecent->{wordlist}} : ();
our @mylist =     (defined $wordlist{$name}) ? @{$wordlist{$name}} : ();
our @foundwords = map { @{$wordlist{$_}} } keys %wordlist;

if ( length($word) < 3 ) {
  # Word too short
  $error = "Too short";
  goto badword;
}

if ( (grep {$word eq $_} @mylist) > 0 ) {
  # Already found
  $error = "Already found";
  goto badword;
}

if ( (grep {$word eq $_} @foundwords) == 0 and not Boggle::isaword($word) ) {
  # Not in dictionary
  $error = "Not in dictionary";
  goto badword;
}

if ( not Boggle::isonboard($mostrecent->{letters}, $word) ) {
  # Not on the board
  $error = "Not on board";
  goto badword;
}

# ------------------------------------------------------------------------------
badword:

if (defined $error) {
  print $error;
}
else {
  Boggle::append( $mostrecent->{filename}, "word_$name=$word" );
  print $Boggle::WORD_POINTS[ length($word) ];
}
