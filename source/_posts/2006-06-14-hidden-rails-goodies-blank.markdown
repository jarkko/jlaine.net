---
layout: post
title: ! 'Hidden Rails Goodies: blank?'
---

When submitting forms in a web app, you often need to check whether a variable is set *and* not an empty string, because unfilled text input fields will be set but empty. In OpenACS there was a procedure called `exists_and_not_null` for this.

In Ruby you could do something like:

`<filter:code lang="ruby">`{=html}\
if params\[:string\] and !params\[:string\].empty?\
`</filter:code>`{=html}

However, that is both laborious and risky. If the variable happened to be something else than a string, calling `empty?` would bomb.

Fortunately, Rails defines a pretty much undocumented method `blank?`. `blank?` is defined in the `Object` class so every possible class in a Rails app will respond to it. By default, `blank?` returns true only for `nil`, `false`, an empty array or hash and "" (an empty string, after stripping the whitespace). Of course, you can overwrite the method in your own classes to make `blank?` behave as you please for them.

`<filter:code lang="ruby">`{=html}\
\>\> 5.blank?\
=\> false\
\>\> o = Object.new\
=\> \#`<Object:0x10f8c6c>`{=html}\
\>\> o.blank?\
=\> false\
\>\> n = nil\
=\> nil\
\>\> n.blank?\
=\> true\
\>\> n = ""\
=\> ""\
\>\> n.blank?\
=\> true\
\>\> f = false\
=\> false\
\>\> f.blank?\
=\> true\
`</filter:code>`{=html}

So using `blank?` you can replace the code above by

`<filter:code lang="ruby">`{=html}\
unless params\[:string\].blank?\
`</filter:code>`{=html}

and you're good to go. Enjoy!
