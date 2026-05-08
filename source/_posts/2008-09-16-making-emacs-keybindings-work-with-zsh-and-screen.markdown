---
layout: post
title: Making emacs keybindings work with zsh and screen
---

I've always (as in from the early OpenACS days) been an emacs guy on linux. Sure, I do most of my development on TextMate these days, but for all text editing on servers I still prefer emacs and have its keybindings tattooed deep in my brain:

  ---------- ---------------------------
  *Ctrl-a*   Beginning of line
  *Ctrl-e*   End of line
  *Ctrl-k*   Kill the rest of the line
  ---------- ---------------------------

Of course, these are the default bindings in bash as well.

However, I'm using [GNU screen](http://www.mattcutts.com/blog/a-quick-tutorial-on-screen/) to stay sane while working over unreliable server connections. Screen uses `Ctrl-a` by default as its escape key so to make it work correctly, I've had this in my `.bash_profile` files for a long time:

```
<code class="shell">alias scr="TERM=vt100 ; screen -e^Oo"
alias scd="TERM=vt100 ; screen -d -r"
</code>
```

That makes (among other things) `Ctrl-o` to be the escape key binding and *lets `Ctrl-a` do the thing it's supposed to do*.

However, I've heard so much talk about [zsh](http://friedcpu.wordpress.com/2007/07/24/zsh-the-last-shell-youll-ever-need/) from many directions lately, that I had to try it out myself. With zsh ([`.zshrc` downloaded from here](http://friedcpu.wordpress.com/2007/07/24/zsh-the-last-shell-youll-ever-need/)) the keys worked fine without screen, but within a screen session they broke. Here's what I had to do to make everything work.

First, setting the default escape key in the screen alias command didn't work. I had to do it in the `~/.screenrc` file instead:

```
<code class="shell">escape ^Oo
startup_message off
</code>
```

(The second line just turns off the annoying splash screen)

However, with this and the default key bindings `Ctrl-a` and friends still didn't work in screen, they were just output as literals on the screen. Some determined googling finally [turned up the key](http://my.opera.com/blackbelt_jones/blog/2007/06/05/zsh-prompt-configuration-issue-solved) (pun unintended) to the puzzle:

```
<code class="shell">bindkey -e
</code>
```

Adding that one line into my `.zshrc` among the other keybindings solved the problem. Now I'm one happy zsh+screen camper, although my journey is still at a very early stage and I'm yet to learn the more advanced zsh goodies. The nice thing has been that without learning really anything new (or changing any habits), I'm still benefiting from using zsh.
