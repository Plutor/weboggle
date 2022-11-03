#!/usr/bin/perl

use warnings;
use strict;
use lib qw( /home/www/htdocs/dev/boggle/cgi ); # XXX - Set correctly

use Boggle;
use Time::HiRes qw(time);
use DB_File;
use POSIX qw(strftime);

use constant MAXPERCBARWIDTH => 200; # Pixels

# ------------------------------------------------------------------------------

our %repcache;
sub load_cache() {
  # Ooh, tie-ing.
  tie %repcache, 'DB_File', Boggle::CACHEFILE, O_RDWR|O_CREAT, 0640, $DB_HASH;
}

sub add_newboards() {
  # Get list of non-dotfiles in boarddir
  if ( opendir(D, Boggle::BOARDDIR) ) {
    my @filelist = readdir(D);
    close(D);

    @filelist = sort grep {/^[^\.]/o} @filelist;

    for my $f (@filelist) {
      add_board($f);
    }
  }
  else {
    warn "Error opening " . Boggle::BOARDDIR . ": $!";
    return {};
  }
}

sub add_board($) {
  my ($filename) = @_;

  if (not defined $repcache{last} or $filename gt $repcache{last}) {
    my %data = %{ Boggle::getboard($filename) };

    if ( defined $data{endtime} and $data{endtime} < time() + Boggle::GRACEPERIOD ) {
      #print "Adding $filename\n";

      my $date = strftime( "%Y-%m-%d", localtime($data{endtime}) );
      my $time = strftime( "%H:%M:%S", localtime(int($data{endtime}/3600)*3600) ); # Rounded to nearest 60 min
      my @players = keys %{$data{wordlist}};
      my @wordlist = map { @{$data{wordlist}{$_}} } @players;

      $repcache{"date $date"} = 0 if (not defined $repcache{"date $date"});
      $repcache{"time $time"} = 0 if (not defined $repcache{"time $time"});
      $repcache{"total"} = 0 if (not defined $repcache{"total"});

      $repcache{"date $date"} += @players;
      $repcache{"time $time"} += @players;
      $repcache{"total"} += @players;
      $repcache{last} = $filename;

      for my $w (@wordlist) {
        next if (length($w) < 7);
        $repcache{"word $w"} = 0 if (not defined $repcache{"word $w"});
        $repcache{"word $w"} ++;
      }
    }
  }
  else {
    #print "Skipping $filename\n";
  }
}

# ------------------------------------------------------------------------------

sub report_htmltable($$) {
  my ($data, $args) = @_;

  my $n = 0;
  my $columns = 2;
  $columns += (defined $args->{showrank} and $args->{showrank} != 0) ? 1 : 0;
  $columns += (defined $args->{showperc} and $args->{showperc} != 0) ? 1 : 0;

  print <<_THEAD_;
<table>
_THEAD_

  print <<_THEAD_ if (defined $args->{title});
  <tr>
    <th colspan="$columns">$args->{title}</th>
  </tr>
_THEAD_

  my @keys = keys( %$data );
  if (defined $args->{sort}) {
    @keys = sort { eval($args->{sort}) } @keys;
  }

  my ($percscale, $topval);
  grep { $topval = $_ if (not defined $topval or $_ > $topval) } values( %$data );
  $percscale = MAXPERCBARWIDTH / $topval;

  for my $w ( @keys ) {
    $n++;

    last if (defined $args->{limit} and $n > $args->{limit});
    my $evenclass = ($n % 2 == 0) ? "even" : "";
    my $topclass = ((not defined $args->{showrank} or $args->{showrank} == 0) and
                    $data->{$w} == $topval) ? "top" : "";

    print <<_ROW_;
  <tr class="$evenclass $topclass">
_ROW_

    print <<_ROW_ if (defined $args->{showrank} and $args->{showrank} != 0);
    <td class="number">$n</td>
_ROW_

    print <<_ROW_;
    <td>$w</td>
    <td class="number">$data->{$w}</td>
_ROW_

    if (defined $args->{showperc} and $args->{showperc} != 0 and defined $percscale) {
      my $perc = sprintf("%.1f%%", (100*$data->{$w}/$args->{showperc}) );
      my $px = int($percscale * $data->{$w});

      print <<_ROW_;
    <td><div class="percbar" style="width: ${px}px" title="$perc"></span></td>
_ROW_
    }

    print <<_ROW_;
  </tr>
_ROW_
  }

  print "</table>\n";
}

# ------------------------------------------------------------------------------

my $n;
my $time = localtime();

load_cache();
add_newboards();

print <<_HEADER_;
Content-Type: text/html

<html>
<head>
  <link rel="stylesheet" type="text/css" href="../styles.css">
  <title>WEBoggle Report</title>
</head>
<body class="report">

<h1>WEBoggle Report</h1>
<h2>$time</h2>
_HEADER_

# FIXME - Replace with better graph
report_htmltable( {
                   map {m/^date (.*)/; ($1 => $repcache{$_})}
                   grep {m/^date /} keys(%repcache)
                  },
                  {
                   sort => '$a cmp $b',
                   title => "Player-games by date",
                   showperc => $repcache{total},
                  }
                );

# FIXME - Replace with better graph
report_htmltable( {
                   map {m/^time (.*)/; ($1 => $repcache{$_})}
                   grep {m/^time /} keys(%repcache)
                  },
                  {
                   sort => '$a cmp $b',
                   title => "Player-games by hour",
                   showperc => $repcache{total},
                  }
                );

report_htmltable( {
                   map {m/^word (.*)/; (lc $1 => $repcache{$_})}
                   grep {m/^word .{7}$/} keys(%repcache)
                  },
                  {
                   sort => '$data->{$b} <=> $data->{$a} || $a cmp $b',
                   title => "Popular 7 Letter Words",
                   limit => 15,
                   showrank => 1,
                  }
                );

report_htmltable( {
                   map {m/^word (.*)/; (lc $1 => $repcache{$_})}
                   grep {m/^word .{8}/} keys(%repcache)
                  },
                  {
                   sort => '$data->{$b} <=> $data->{$a} || $a cmp $b',
                   title => "Popular 8+ Letter Words",
                   limit => 15,
                   showrank => 1,
                  }
                );

print <<_FOOTER_;
</body>
</html>
_FOOTER_
