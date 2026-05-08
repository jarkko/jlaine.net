---
layout: post
title: Emacs note to self
---

For some reason some files in my CVS checkout sometimes end up without write-permissions for myself. I can easily change them in emacs shell buffer, but if they're already open in emacs, I still get `&lt;buffer is read-only&gt;` nags. Here's how to get rid of that: `meta x toggle-read-only` or `C-x C-q`.

Thanks to [Andrew Grumet](http://www.grumet.net/weblog/) and blighty at #openacs who helped me out with this.
