---
layout: post
title: Ruby, meet QuickRoute
---
While I missed the tradition of releasing Ruby gems on the Christmas day, I did meet my own tradition of not doing anything with the computer that day. That said, I had something interesting in the works that just needed to be wrapped up as a Ruby gem—namely, a library for parsing the GPS data out of JPEG files produced by [QuickRoute](http://www.matstroeng.se/quickroute/en/). Without further ado, may I present [quickroute-ruby](https://github.com/jarkko/quickroute-ruby).

The task wasn't exactly trivial, as the data is embedded in binary format in an [APP0 segment](http://en.wikipedia.org/wiki/JPEG_File_Interchange_Format#JFIF_segment_format) inside the image. Moreover, the data format was basically undocumented. However, with the help of [Mats](http://www.matstroeng.se/) I managed to reverse-engineer the original C# and PHP libraries to an extent that I seemed to get correct output out of the file.

The library is still very young, and while it seems to work correctly with my test images, I have no doubt there are a bunch of bugs hidden. If you seem to run into one, please file an [issue in the tracker](https://github.com/jarkko/quickroute-ruby/issues), or better yet, send me a [pull request](https://github.com/jarkko/quickroute-ruby/pulls) with a test-driven fix.

For usage, check out the GitHub page. I'll work on cleaning up the code and writing some more documentation in the coming days, but the code itself should be fairly self-explanatory.

Happy New Year!

**P.S** [I'm also mirroring](https://github.com/jarkko/quickroute-gps) the complete (GPL licensed) [QuickRoute C# code repository](http://code.google.com/p/quickroute-gps/) on GitHub. So if you prefer working with Git instead of Subversion + Google Code, you might want to start off there.
