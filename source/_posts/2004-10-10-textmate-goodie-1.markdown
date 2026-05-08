---
layout: post
title: ! 'TextMate Goodie #1'
---

As I promised, here's a macro/snippet trick you can use to create a ruby function definition in TextMate:

1. Create a new snippet as follows and bind it to trigger `_def`:

   ```
   def ${1:funcname}
       $2
   end
   ```

2. Type word 'test' into a new document (to be used in the macro recording).
3. Start recording pressing alt-command-M.
4. Press alt-W to select the word you wrote in step 2. Note that this selects the word you're in unless you already have a selection (in which case the selection stands intact). Therefore starting a new macro like this with alt-W is almost always a very neat trick.
5. Press command-X to cut the selected word.
6. Type '\_def' and press `tab` to invoke the snippet you created in step 1.
7. Press command-V to paste the word you cut a few steps ago.
8. Press `tab` to move the cursor to the second insertion point of the snippet (i.e. in the middle of the def block).
9. Stop recording the macro and save it. David Heinemeier Hansson uses keybinding command-enter for this macro and it sounds like a reasonable option to me, but feel free to select the binding as you please.

There you go! Now you can just type the name of the function and hit command-enter and get the function body created for you. Note that this technique is by no means limited to ruby or function definitions. You can actually do with it almost anything. Just let your imagination fly!
