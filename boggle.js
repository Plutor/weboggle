var X_SIZE = 4;
var Y_SIZE = 4;

var totalpoints = 0;
var boardvals;
var lastword;
var roundend;
var name;
var boarddata;
var lastwordlist;
var scoring = 0;

var scoresdata;
var missedwordsdata;

/* ------------------------------------------------------- Static DOM objects */

var board;
var words;
var messagetxt;
var scores;

/* ----------------------------------------------------------- Initialization */

function init() {
  board = document.getElementById("board");
  words = document.getElementById("words");
  messagetxt = document.getElementById("message").firstChild
  scores = document.getElementById("scores");
  name = getname();

  initboard();
  getboarddata();
  clearwordlist();
}

function initboard() {
  boardvals = new Array();

  for (var y = 0; y < Y_SIZE; ++y) {
    var row = board.insertRow( board.rows.length );
    row.className = "row";
    boardvals.push( new Array(X_SIZE) );

    for (var x = 0; x < X_SIZE; ++x) {
      var cell = row.insertCell( row.cells.length );
      var letternode = document.createTextNode( "-" );
      cell.appendChild( letternode );
      cell.className = "cell timeup";
    }
  }
}

function getname() {
  if (document.cookie) {
    var c = document.cookie;
    var clist = c.split(";");
    for (i in clist) {
      var d = clist[i].split("=");
      if (d[0] == "name") return d[1];
    }
  }

  /* Random */
  var name = "";
  for (var i=0; i<6; ++i)
    name += String.fromCharCode( 97 + Math.random()*26 );

  return name;
}

/* --------------------------------------------------------------- Game setup */

function clearwordlist() {
  while ( words.childNodes[0] )
    words.removeChild( words.firstChild );

  totalpoints = 0;
  update_score();

  document.forms.wordform.n.value = "";
  document.forms.wordform.n.focus();
}

function setupboard( data ) {
  var pieces = data.split("");

  for (var y = 0; y < Y_SIZE; ++y) {
    var row = board.rows[y];

    for (var x = 0; x < X_SIZE; ++x) {
      var cell = row.cells[x];
      var celltext = cell.firstChild;
      var letter = new String( pieces.splice(0, 1) );
      boardvals[y][x] = letter;

      if ( letter == "Q" ) {
        celltext.nodeValue = "Qu";
      }
      else {
        celltext.nodeValue = letter;
      }

      cell.className = "cell";
    }
  }

  setTimeout( checktimer, 100 );
}

function getboarddata() {
  // Start http object
  try {
    var xmlhttp = newxmlhttp();
    xmlhttp.open('GET', 'cgi/getboard.cgi', true);
    var callnum = alloccall();
    calls[callnum] = new BoardDataObject( xmlhttp );
    xmlhttp.onreadystatechange = Function( 'handleboarddata(' + callnum + ');' );
    xmlhttp.send(null);
  }
  catch(e) { }
}
function BoardDataObject( xmlobj ) {
  this.xmlobj = xmlobj;
}
function handleboarddata( callnum ) {
  var rtext;

  try {
    var call = calls[callnum];
    if (call.xmlobj.readyState < 4) return;
    rtext = call.xmlobj.responseText;
    calls[callnum] = null;
  }
  catch(e) { }

  pregame( new String(rtext).split("\n") );
}

function pregame(data, eventend) {
  /* Go! */
  var timeleft;
  if (!eventend) {
    timeleft = new Number(data[0]);
    eventend = now() + timeleft;
  }
  else {
    timeleft = eventend - now();
  }

  if (data == "" || data[1] == "") {
    messagetxt.nodeValue = "A new game begins in " + Math.floor(timeleft/1000) + " seconds!";

    if (timeleft >= 25000) {
      /* Pregame, scoring */
      setTimeout( "pregame('', " + eventend + ")", 100 );
    }
    else if (timeleft < 25000 && timeleft >= 0) {
      /* Pregame, waiting */
      if (scoring == 1) {
          scoring = 2;
          getboarddata();
          return;
      }
      else if (scoring == 2) {
          scoresdata = data[2];
          missedwordsdata = data[3];

          updatescoreboard();
      }

      setTimeout( "pregame('', " + eventend + ")", 100 ); 
    }
    else {
      clearwordlist();
      getboarddata();
    }
  }
  else {
    /* Ingame */
    roundend = eventend;
    boarddata = data[1];
    setupboard( boarddata );

    scoresdata = data[2];
    missedwordsdata = data[3];
    updatescoreboard();
  }
}

function timeup() {
  startscoring();

  var wordnodes = words.childNodes;
  lastwordlist = new Array();
  for (var i=0; i < wordnodes.length; ++i) {
    lastwordlist.push(wordnodes[i].firstChild.nodeValue);
  }

  for (var y = 0; y < Y_SIZE; ++y) {
    for (var x = 0; x < X_SIZE; ++x) {
      board.rows[y].cells[x].className = "cell timeup";
    }
  }

  getboarddata();
}

function clearscoreboard() {
  if (scores.rows.length == 0) {
    var trow = scores.insertRow(0);
    var tcell = trow.insertCell(0);
    tcell.className = "title";
    tcell.colSpan = 2;
    var title_text = document.createTextNode( "Last round scores" );
    tcell.appendChild(title_text);
  }
  else {
    while (scores.rows.length > 1) {
      scores.deleteRow(1);
    }
  }
}
function startscoring() {
  clearscoreboard();
  scoring = 1;

  var trow = scores.insertRow(1);
  var tcell = trow.insertCell(0);
  tcell.className = "row";
  tcell.colSpan = 2;
  var title_text = document.createTextNode( "Scoring.." );
  tcell.appendChild(title_text);
}
function updatescoreboard() {
  var scorelist = (scoresdata > "") ? new String(scoresdata).split(",") : new Array();
  var wordslist = (missedwordsdata > "") ? new String(missedwordsdata).split(",") : new Array();

  clearscoreboard();
  scoring = 0;

  var topscore;
  if (scorelist.length > 0) {
    for (var i=0; i<scorelist.length; ++i) {
      var trow = scores.insertRow( scores.rows.length );
      var d = scorelist[i].split("=");

      if (i==0) topscore = d[1];

      var namecell = trow.insertCell(0);
      namecell.className = "row";
      if (d[1] == topscore) namecell.className += " top";
      var nametext = document.createTextNode( d[0] );
      namecell.appendChild(nametext);

      var scorecell = trow.insertCell(1);
      scorecell.className = "row score" + (d[1] == topscore ? " top" : "");
      var scoretext = document.createTextNode( d[1] );
      scorecell.appendChild(scoretext);
    }
  }
  else {
    var trow = scores.insertRow(1);
    var tcell = trow.insertCell(0);
    tcell.className = "row";
    tcell.colSpan = 2;
    var title_text = document.createTextNode( "None recorded" );
    tcell.appendChild(title_text);
  }

  /* Eliminate words that we got */
  var missedwords = new Array();
  for (m in wordslist) {
    var found = false;
    for (w in lastwordlist) {
      if (lastwordlist[w] == wordslist[m]) found = true;
    }

    if (!found)
      missedwords.splice(Math.random() * wordslist.length, 0, wordslist[m]);
  }

  if (missedwords.length > 0) {
    var trow = scores.insertRow(scores.rows.length);
    var tcell = trow.insertCell(0);
    tcell.className = "missed";
    tcell.colSpan = 2;

    var title_text = document.createTextNode( "Words you missed last round: " );
    tcell.appendChild(title_text);

    var maxmissed = 8;
    if (maxmissed > missedwords.length) maxmissed = missedwords.length;
    for (m=0; m<maxmissed; ++m) {
      var word = document.createElement('span');
      word.className = "missedword";
      var wordtext = document.createTextNode( missedwords[m] );
      word.appendChild(wordtext);
      tcell.appendChild(word);

      if (m < missedwords.length - 1) {
        var comma = document.createTextNode( ", " );
        tcell.appendChild(comma);
      }
    }

    if (maxmissed < missedwords.length) {
      var andmore = document.createTextNode( "and " + (missedwords.length-maxmissed) + " more" );
      tcell.appendChild(andmore);
    }
  }
}

/* -------------------------------------------------------------- Pathfinding */
function checktimer() {
  var timeleft = (roundend - now())/1000;

  if (timeleft >= 0) {
    var timeleft_min = Math.floor(timeleft/60);
    var timeleft_sec = Math.floor(timeleft) % 60;
    if (timeleft_sec < 10) { timeleft_sec = "0" + timeleft_sec; }
    messagetxt.nodeValue = "Time left: " + timeleft_min + ":" + timeleft_sec;

    setTimeout(checktimer, 300);
  }
  else {
    timeup();
  }
}

function redraw_path() {
  var timeleft = (roundend - now())/1000;
  if (timeleft < 0) return;

  var word = new String(document.forms.wordform.n.value);
  var path = getpath( word.toUpperCase(), null );
  if (!path) path = new Array();

  for (var x = 0; x < X_SIZE; ++x) {
    for (var y = 0; y < Y_SIZE; ++y) {
      board.rows[y].cells[x].className = "cell";
    }
  }

  for (var i = 0; i < path.length; ++i) {
    var row = board.rows[path[i][1]];
    if (row != null) {
      var cell = row.cells[path[i][0]];
      if (cell != null) {
        if (i == path.length-1) {
          cell.className = "cell cursor";
        }
        else {
          cell.className = "cell inword";
        }
      }
    }
  }
}

function getpath( word, path ) {
  // Get rid of U after Q
  if (word.substr(0,1) == "Q" && word.substr(1,1) == "U") {
    word = new String(word.substr(0,1) + word.substr(2));
  }

  if (path == null || path.length < 1) {
    // First letter
    for (var x = 0; x < X_SIZE; ++x) {
      for (var y = 0; y < Y_SIZE; ++y) {
        if (word.substr(0,1) == boardvals[y][x]) {
          path = new Array( new Array(x, y) );

          if (word.length == 1) {
            return path;
          }
          else {
            var p = getpath(word.substr(1), path);
            if (p != null) return p;
          }

          path.pop();
        }
      }
    }
    return;
  }
  else {
    var lastx = path[path.length-1][0];
    var lasty = path[path.length-1][1];

    for (var x = -1; x <= 1; ++x) {
      for (var y = -1; y <= 1; ++y) {
        if (lastx+x < 0 || lastx+x > X_SIZE-1 || lasty+y < 0 || lasty+y > Y_SIZE-1 ) continue;
        if (x == y && x == 0) continue;

        // Check to see if we've hit this box before
        var dup = false;
        for (var i = 0; i < path.length && !dup; ++i) {
          if (lastx+x == path[i][0] && lasty+y == path[i][1]) dup = true;
        }
        if (dup) continue;

        if (word.substr(0,1) == boardvals[lasty+y][lastx+x]) {
          path.push( new Array(lastx+x, lasty+y) );

          if (word.length == 1) {
            return path;
          }
          else {
            var p = getpath(word.substr(1), path);
            if (p != null) return p;
          }

          path.pop();
        }
      }
    }
    return;
  }
}

function saveword() {
  var timeleft = (roundend-Date.parse(new Date()))/1000;

  if (timeleft >= 0) {
    var word = new String( document.forms.wordform.n.value ).toUpperCase();
    var li = addtowordlist(word);

    //redraw_path( new Array() );
    checkword( word, li );
  }

  document.forms.wordform.n.value = "";
  document.forms.wordform.n.focus();
}

/* ------------------------------------------------------ Check word validity */
function checkword( word, domobj ) {
  if (findword(word) != domobj) {
    markentry(domobj, "Already found");
    return;
  }

  // Start http object
  try {
    var xmlhttp = newxmlhttp();
    // xmlhttp.open('GET', 'cgi/checkword.cgi?' + name + "," + word, true);
    xmlhttp.open('GET', 'cgi/checkword.cgi?' + word, true);
    var callnum = alloccall();
    calls[callnum] = new CallObject( xmlhttp, word, domobj );
    xmlhttp.onreadystatechange = Function( 'gotdata(' + callnum + ');' );
    xmlhttp.send(null);
  }
  catch(e) {}
}
function gotdata( callnum ) {
  try {
    var call = calls[callnum];
    if (call.xmlobj.readyState < 4) return;

    var rtext = call.xmlobj.responseText;
    markentry( call.domobj, rtext );
    calls[callnum] = null;
  }
  catch(e) { }
}
function CallObject( xmlobj, word, domobj ) {
  this.xmlobj = xmlobj;
  this.word = word;
  this.domobj = domobj;
}

/* Wordlist operations */
function addtowordlist( word ) {
  var li = document.createElement('li');
  li.className = "word";
  var text = document.createTextNode( word );
  li.appendChild( text );
  words.insertBefore(li, words.firstChild);

  return li;
}
function markentry( wordnode, output ) {
  var points = new Number( output );
  var bad_reason = new String( output );

  if (wordnode) {
    var word = wordnode.firstChild.nodeValue;
    wordnode.className = ( points > 0 ? "word good" : "word bad" );

    if (points > 0) {
      var pointword = "point" + (points == 1 ? "" : "s");

      var reason = document.createElement('span');
      reason.className = "reason";
      var reason_text = document.createTextNode( "(" + points + " " + pointword + ")" );
      reason.appendChild(reason_text);
      wordnode.appendChild(reason);

      totalpoints += points;
      update_score();
    }
    else if (bad_reason) {
      var reason = document.createElement('span');
      reason.className = "reason";
      var reason_text = document.createTextNode( "(" + bad_reason + ")" );
      reason.appendChild(reason_text);
      wordnode.appendChild(reason);
    }
  }
}
function findword( word ) {
  var wordlist = words.childNodes;

  for (var i = wordlist.length-1; i >= 0; --i) {
    var thisword = wordlist[i];
    if (thisword == null || thisword.firstChild == null) continue;
    if (thisword.firstChild.nodeValue == word) return thisword;
  }
}

function update_score() {
  var score = document.getElementById("score").firstChild;
  score.nodeValue = "Total score: " + totalpoints;
}

/* ----------------------------------------------------------- Async download */

function newxmlhttp() {
  try { return new ActiveXObject('Microsoft.XMLHTTP'); }
  catch(e) { try { return new XMLHttpRequest(); }
  catch(e) { alert(e); } }
}
var calls = new Array(8);
function alloccall() {
  var n = 0;
  while (calls[n] != null) {
    n = (n+1) % calls.length;
  }
  return n;
}

function now() { var n = new Date(); return ( Date.parse(n) + n.getMilliseconds() ); }
