---
layout: post
title: ! '"Undocumented" Rails finesses, part I'
---

Undocumented in quotes because they're really not undocumented, I just didn't know about them before.

1. **Automatic handling of creation time and modification time in ActiveRecord.** Just put two timestamp fields in your database, `created_at` and `updated_at`, and you're done. The fields will be automatically used by ActiveRecord whenever a new object is saved for the first time or updated. You don't have to worry about them anymore.

2. **Optimistic locking.** Just read about this one in the mailing list. Add a field called `lock_version` (integer) into your table and ActiveRecord will use optimistic locking for that table from now on, as long as you put a hidden field with that version to your edit form. What does it mean? When you start editing an object, its `lock_version` is read from the database. As you submit your changes, your `lock_version` is compared to the current one in the database and if the db version has been bumbed up, your submittal is not accepted and an exception is raised. You (as an application developer) can then inform the user (hey, that was you, too!) about the situation and show her the latest version. Preferably show her her changes, too, otherwise she has to write the whole story again. You don't want that, do you?

Rails is full of this kind of candies, so it's worth exploring the [API documentation](http://rails.rubyonrails.com). It's still a fairly moving target so I try to keep popping these 'rubies' up to the surface as I discover them.
