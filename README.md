# Weboggle

Weboggle was a dynamic HTML game I made in 2004, before "AJAX" had been coined, before web 2.0, before HTML5. Here's what I wrote at the time:

## Motivation

Around the the end of January, I was doing some reading for work on the [Document Object Model](http://www.w3.org/DOM/) (DOM). The DOM (ideally) allows JavaScript to access and modify any element in an HTML document in a heirarchical Object-Oriented fashion (well, as OO as Javascript can ever be). The more I read about what was possible, the more I realized that I could create a totally interactive application written in merely HTML and JavaScript.

Then I remembered what I think is the most useful JavaScript feature in existance: asyncronous HTTP requests using the [XMLHTTP object](http://msdn.microsoft.com/library/default.asp?url=/library/en-us/xmlsdk30/htm/xmobjxmlhttprequest.asp) for Internet Explorer or the [XMLHttpRequest](http://www.mozilla.org/xmlextras/) object in Mozilla-based browsers. Using this object and a little server-side scripting, I could not only keep important logic and large files like dictionaries on the server, but I could also create multiplayer (potentially _massively_ multiplayer) interactive online games that required nothing but a modern browser.

Think about [PopCap](http://www.popcap.com/), [Pogo](http://www.pogo.com/), [Yahoo Games](http://games.yahoo.com/), and [MSN Games](http://zone.msn.com/). Every single one of the games on these sites could be done without requiring a single plugin. I thought about it, and I decided to set about demonstrating it. (It was only after this game was mostly completed that I noticed [SSCrabble](http://www.themaninblue.com/experiment/SSCrabble/). While it uses similar client-side scripting techniques, it lacks the multiplayer functionality entirely, which is too bad.)

## Technology

WEBoggle is primarily HTML and JavaScript. There's fewer than 100 server-side lines of Perl, and a 90,000 word dictionary.

All WEBoggle requires is either Internet Explorer 5 or newer, or a Mozilla-based browser like [Mozilla](http://www.mozilla.org/), [Firebird](http://www.mozilla.org/products/firebird/) or [Galeon](http://galeon.sourceforge.net/). (Internet Explorer 4 _should_ work, but I've never tried it.). There are a few caveats, and good reasons why other common browsers like Opera do not work, but those are all listed in the Bugs section below. Also, your browser must accept cookies. Sorry.

## Cheating

Cheating in an online game is an inherent problem. I've worked as hard as I could in order to keep important scoring logic server-side in WEBoggle. I'm only human, and it's possible that I've missed something and it's possible to modify the JavaScript source code so that it submits invalid words and they get erroneously scored.

A much easier way to cheat, however, is to write a script to give you all of the words that can be found on the board. I could have made it more difficult to do this, but as long as the letters are legible to the player, you could simply type them into a command line script that would then give you a list of words to type back into the game. There was simply no way to prevent this. (I wrote such a script in about 60 seconds, so if you're considering it, your effort won't make you "the first". I was able to get more than 50 points consistantly.)

I just hope that everyone who plays this game remembers that cheating is no fun, not for you, and not for anyone with whom you're playing..

## Bugs

### All Browsers

Sometimes at the beginning of a round, the word list doesn't clear. If this annoys you, just reload the page before you put any words in. It doesn't happen all the time, and I'm not sure why it _ever_ happens. It shouldn't affect your score positively or negatively, however.

### Microsoft Internet Explorer

IE's caching is kind of stubborn, even when I send a "Cache-Control" header. If you use Internet Explorer and your game never ends (the timer loops a lot), you can fix this by going to Tools -> Internet Options, clicking "Settings..." button near the center of the dialog, andsetting "Check for newer versions of stores pages" to "Every visit to the page". (Then click OK twice and reload the game page).

### Opera

My brother uses Opera as his primary browser, so I'm kinda disappointed. There's no ansychronous HTTP request object in Opera, as far as I can tell. If anyone has any information otherwise, I'd be _glad_ to add support for this browser.

### Safari

Older versions of Safari had some pretty significant table DOM bugs, but these appear to be corrected with version 1.2. I've gotten at least one report of WEBoggle crashing Safari at the end of a round, but since I don't have a Mac, I can't duplicate this behavior.

### Other Browsers

There are many other browsers that it'd be great to support. Text-based browsers like links and lynx would certainly be nice, for instance. Without an HTTP request object -- not to mention almost zero JavaScript or DOM support -- most of the game would have to be written server-side, which kind of eliminates the whole purpose of this project.

There are several other browsers for which this _might_ work, but I don't know. If you have a browser not listed above (Konqueror, Hot Java, OmniWeb, etc), I'd love to hear from you.

## Acknowledgements

I'd like to thank everyone who helped me test WEBoggle and suggested stupid improvements: BrainiACK, Nomad, Splatta, Kazy, and especially Maureen.
