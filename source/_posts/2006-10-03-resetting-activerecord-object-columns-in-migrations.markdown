---
layout: post
title: Resetting ActiveRecord object columns in migrations
---

Often when you use migrations to keep track of your database schema, you also need to migrate data around in the database. You can use the `execute` method to do this in pure SQL, but since migrations are Ruby code and have access to all the ActiveRecord code, why not do it in there? Here's an example from our latest project where I reverse a has_one---belongs_to association:

`<filter:jscode lang="ruby">`{=html} def self.up\
add_column :images, :content_id, :integer

Content.find(:all, :conditions =\> "image_id is not null").each do \|entry\|\
image = Image.find_by_id(entry.image_id) rescue nil\
if image\
image.content_id = entry.id\
image.save\
end\
end

remove_column :contents, :image_id\
end\
`</filter:jscode>`{=html}

However, this has one problem. The Image class is loaded and the column information cached before the column `content_id` is added, so it doesn't have the getter and setter methods for that column and thus `image.content_id = entry.id` will bomb.

Fortunately this is easy enough to fix. Just call `Classname.reset_column_information` after the column is added, and the new column will be found:

`<filter:jscode lang="ruby">`{=html} def self.up\
add_column :images, :content_id, :integer

Image.reset_column_information\
Content.find(:all, :conditions =\> "image_id is not null").each do \|entry\|\
image = Image.find_by_id(entry.image_id) rescue nil\
if image\
image.content_id = entry.id\
image.save\
end\
end

remove_column :contents, :image_id\
end\
`</filter:jscode>`{=html}
