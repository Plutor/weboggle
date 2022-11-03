package Boggle;

use warnings;
use strict;

use Fcntl ':flock';
use Time::HiRes qw(time);

use constant BOGGLEDIR => "/home/www/htdocs/dev/boggle";  # XXX - Set correctly
use constant BOARDDIR => BOGGLEDIR . "/boards";
use constant DICT => BOGGLEDIR . "/dict";
use constant CACHEFILE => BOGGLEDIR . "/report.cache";

use constant INITIAL_WAIT => 30;    # All constant times in seconds
use constant ROUND_TIME => 3*60;
use constant GRACEPERIOD => 4;

# ------------------------------------------------------------------------------
our @CUBES = ("AACIOT", "DENOSW", "ABILTY", "DKNOTU",
              "ABJMOQ", "EEFHIY", "ACDEMP", "EGINTV",
              "ACELSR", "EGKLUY", "ADENVZ", "EHINPS",
              "AHMORS", "ELPSTU", "BFIORX", "GILRUW");
our @WORD_POINTS = qw( 0 0 0 1 1 2 3 5 11 11 11 11 11 11 11 11 11 );

# ------------------------------------------------------------------------------
# Opens board data file 'n' games before most recent
# Returns hashref
sub getboard_offset(;$) {
  my ($offset) = @_;
  $offset = 0 unless (defined $offset);

  # Get list of non-dotfiles in boarddir
  if ( opendir(D, BOARDDIR) ) {
    my @filelist = readdir(D);
    close(D);

    @filelist = sort grep {/^[^\.]/o} @filelist;

    if (@filelist >= $offset+1) {
      return getboard( $filelist[-(1+$offset)] );
    }
    else {
      #warn "There are only " . scalar(@filelist) . " files, you need " . ($offset+1);
      return {};
    }
  }
  else {
    warn "Error opening " . BOARDDIR . ": $!";
    return {};
  }
}

sub getboard($) {
  my ($filename) = @_;
  my %data;

  # Try to open file n and get lock
  if ( open(F, "<", BOARDDIR . "/$filename") ) {
    if ( not flock(F, LOCK_EX) ) {
      warn "Error getting lock (getboard) for " . BOARDDIR . "/$filename: $!";
      close(F);
      return {};
    }

    # Parse it all
    while( my $line = <F> ) {
      chomp $line;
      next if ($line eq "");

      my ($arg, $val) = split(/=/, $line, 2);

      if ($arg =~ /^word_(.*)/) {
        push @{ $data{wordlist}{$1} }, $val;
      }
      else {
        $data{$arg} = $val;
      }
    }

    close(F);
  }
  else {
    warn "Error opening " . BOARDDIR . "/$filename: $!";
    return {};
  }

  $data{filename} = $filename;

  return \%data;
}

sub releasefile($) {
  my ($dataref) = @_;
  my %data = %$dataref;

  close( $data{filehandle} );
  $data{filename} = undef;
}

# Appends a line to a file
sub append($$) {
  my ($filename, $line) = @_;

  if ( not -f BOARDDIR . "/$filename" ) {
    warn "Can't append to non-existant file " . BOARDDIR . "/$filename";
    return;
  }

  if ( open(F, ">>", BOARDDIR . "/$filename") ) {
    if ( not flock(F, LOCK_EX) ) {
      warn "Error getting lock (append) for " . BOARDDIR . "/$filename: $!";
      close(F);
      return;
    }

    print F "$line\n";
    close(F);
  }
}

# ------------------------------------------------------------------------------
# Creates a new board
sub createnewboard($) {
  my ($filename) = @_;
  my (@filelist, %data, $success);

  $filename = sprintf("%06d", $filename);

  # In order to create-and-lock-but-not-clobber, we'll use a semaphore file for the lock.
  if ( open(SEM, "<< /tmp/weboggle.sem") ) {
    if ( not flock(SEM, LOCK_EX | LOCK_NB) ) {
      # Someone else is creating the board.
      # FIXME - Should probably spin on seeing the actual file?  This is a tough one.
      select(undef, undef, undef, 100);
      close(SEM);
      return getboard_offset();
    }
  }

  # Try to open file
  if ( open(F, ">", BOARDDIR . "/$filename") ) {
    if ( not flock(F, LOCK_EX) ) {
      # This is a serious problem if we can't lock the file we think we're creating.
      close(F);
      die "Oh crap, we can't lock our file: $!";
    }

    $data{filename} = $filename;

    print F "starttime=" . (time() + INITIAL_WAIT) . "\n";
    print F "endtime=" . (time() + INITIAL_WAIT + ROUND_TIME) . "\n";

    # Oh yeah, generate the actual board
    my $letters = "";

    my @cubestemp = @CUBES;
    while (@cubestemp > 0) {
      my $cubenum = rand(@cubestemp);
      my $cube = splice(@cubestemp, $cubenum, 1);
      my $letternum = rand( length($cube) );

      $letters .= substr($cube, $letternum, 1);
    }
    print F "letters=$letters\n";
    close(F);
  }
  else {
    warn "Error opening " . BOARDDIR . "/$filename: $!";
    return {};
  }

  return getboard_offset();
}

# ------------------------------------------------------------------------------
# Calculates the total scores from the wordlists
sub totalscores($) {
  my ($wordlistref) = @_;
  return "" if (not defined $wordlistref);

  my %wordlist = %$wordlistref;

  my (@allscores);

  for my $name (keys %wordlist) {
    my $score = 0;

    for my $word ( @{$wordlist{$name}} ) {
      $score += $WORD_POINTS[ length($word) ];
    }

    push @allscores, [ $name, $score ];
  }

  @allscores = sort { $b->[1] <=> $a->[1] } @allscores;
  @allscores = map { "$_->[0]=$_->[1]" } @allscores;

  return join(",", @allscores);
}

# ------------------------------------------------------------------------------
# Check if something is on board
sub isonboard($$;$$);
sub isonboard($$;$$) {
    my ($board, $word, $x, $y) = @_;
    my ($n, $r, @xlist, @ylist);

    #print STDERR "isonboard('$board', '$word', " . ($x||"(undef)") . ", " . ($y||"(undef)") . ")\n";

    $n = substr($word, 0, 1);
    $r = substr($word, 1);

    if ($n eq "Q") {
      if (length($word) > 2) {
        $r = substr($word, 2);
      }
      else {
        return 0;
      }
    }

    if (not defined $x and not defined $y) {
        @xlist = qw(0 1 2 3);
        @ylist = qw(0 1 2 3);
    }
    else {
        @xlist = ($x-1, $x, $x+1);
        @ylist = ($y-1, $y, $y+1);
    }

    for my $dx (@xlist) {
        for my $dy (@ylist) {
            next if (defined $x and $dx == $x and defined $y and $dy == $y);
            next if ($dx > 3 or $dy > 3 or $dx < 0 or $dy < 0);

            if ($n eq substr($board, $dy*4+$dx, 1)) {
                my $tboard = substr($board, 0, $dy*4+$dx) . "-" .
                    substr($board, $dy*4+$dx+1);

                #print STDERR "$tboard\n";

                if ($r eq "" or isonboard($tboard, $r, $dx, $dy)) {
                    return 1;
                }
            }
        }
    }

    return 0;
}

# ------------------------------------------------------------------------------
# Check if the word is in the dictionary
sub isaword($) {
    my ($word) = @_;
    my $dict = DICT;

    chomp( my $grepoutput = `grep -i ^$word\$ $dict` );

    return ($grepoutput ne "");
}

1;
