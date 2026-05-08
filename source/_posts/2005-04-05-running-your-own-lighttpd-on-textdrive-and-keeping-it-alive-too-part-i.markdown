---
layout: post
title: Running your own lighttpd (on TextDrive) and keeping it alive, too (Part I)
---

Now that TextDrive [supports](http://weblog.textdrive.com/article/31/having-ones-own-lighttpd-and-running-it-too) [lighttpd](http://lighttpd.net/) and I'm eventually moving all my sites to a lighttpd/fastcgi setup, I'm confronted with a new problem: the webserver process is now mine and I'm the one responsible for keeping it running.

The first thing to remember (and to fix) is that my lighttpd process is **not** started automatically at server bootup. This is fortunately easy to fix:

1.  Login to webmin (e.g. [http://webmin.bidwell.textdrive.com](http://webmin.bidwell.textdrive.com)) and click *Scheduled Cron Jobs* under *System*. **Important:** you can't use usermin as it doesn't seem to have the necessary privileges to schedule cron jobs. So do yourself a favor and dive right into webmin.
2.  Click *Create a new scheduled cron job*.
3.  Type your lighttpd startup command in the *Command* field. For example, `/usr/local/sbin/lighttpd -f /usr/home/[yourname]/sites/[yoursite]/config/lighttpd.conf`. Remember that you need to use the whole paths in your command, otherwise all hell can break loose.
4.  Select *Simple schedule* and *When system boots* from the drop-down menu.
5.  Submit the form clicking *Create*.

Congrats! Your lighttpd service should now survive the unfortunate days when "*a pair of redundant UPS units fail*".

We're not quite there yet, though. As sure as people die some day, processes die too. Wouldn't it be even nicer if we could somehow monitor that our beloved lighttpd is up and running at all times? *Hint: yes, it would.*

So, next we're going to wrap up a Ruby script that keeps a keen eye on our webserver. But that's a great topic for a sequel (I'll never get to write sequels unless I break my stories in multiple parts). So go ahead and implement your own reboot-surviving lighttpd machine. More to come later.
