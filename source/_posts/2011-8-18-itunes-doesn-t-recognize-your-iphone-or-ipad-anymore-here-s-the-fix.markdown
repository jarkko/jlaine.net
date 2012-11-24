---
layout: post
title: iTunes doesn't recognize your iPhone or iPad anymore? Here's the fix.
---
Somewhere between updating OS X to Lion and iTunes to version 10.4 iTunes stopped recognizing both my iPhone and my iPad. What's weirder, even though System information saw both devices, my iPad also showed the disappointing "Not Charging" message in its status bar. The iPhone, which doesn't demand as high a voltage from the port, did charge, though.

The web is full of different instructions on how to fix this kind of a situation. The gist of them all is basically to restart the device, restart the computer and if these won't help, reinstall iTunes. There is even a [knowledge base article](http://support.apple.com/kb/ht1747) on the Apple support pages with these instructions.

The problem is, Lion doesn't let you move iTunes to the Trash because it is "needed by the operating system"<sup id="fnl_201108180101">[1](#fn_201108180101)</sup>, contrary to what the aforementioned article says<sup id="fnl_201108180102">[2](#fn_201108180102)</sup>.

Fortunately, OS X is built on the shoulders of Unix giants, so here's how I managed to fix the problem.

1. Open up Terminal.app, e.g. using Spotlight.
![Find Terminal using Spotlight search](https://img.skitch.com/20110818-826b9ngu72e4cauhp1m61ape24.jpg)
2. Move the iTunes.app directory to a temporary place. Note that you need sudo to be able to actually move the folder.
        
        $ mkdir -p ~/temp; cd /Applications; sudo mv iTunes.app ~/temp
3. Download the [latest iTunes version](http://www.apple.com/itunes/download/) from Apple's website and run through the installation process.
4. There is no step four. iTunes should now recognize your devices again.

**Warning**. This procedure fixed the issue for me. It should not affect your iTunes library (which is normally located in `~/Music/iTunes`) or preferences (which reside in `~/Library/iTunes`). However, there is no guarantee that it will work for you. Don't hold me accountable if you mess up your iTunes library. What's more important, *make sure you have backups of everything before you start*.

<div class="footnotes">
<hr />
<ol>
<li id="fn_201108180101">
<p>After reinstalling iTunes this error mysteriously disappeared, i.e. I am now able to drag the iTunes.app folder to the trash just fine.&nbsp;<a href="#fnl_201108180101">&#8617;</a></p>
</li>
<li id="fn_201108180102">
<p>To be fair, the article is dated back to last December and has not been updated to the Lion era. Which begs the question, why not?&nbsp;<a href="#fnl_201108180102">&#8617;</a></p>
</li>
</ol>
</div>
