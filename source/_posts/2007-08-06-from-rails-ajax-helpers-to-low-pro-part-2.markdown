---
layout: post
title: From Rails Ajax helpers to Low Pro, Part 2
---

**See also:** [Part 3](http://jlaine.net/2008/9/9/from-rails-ajax-helpers-to-low-pro-part-3-some-announcements)

In the [first part](http://jlaine.net/2007/8/3/from-rails-ajax-helpers-to-low-pro-part-i) of this series, we had a look at how we have evolved from using the standard Rails Javascript helpers to first use the UJS for Rails plugin and then to use Low Pro on its own.

However, there's not much documentation about Low Pro yet. In this article, we'll introduce Low Pro to you by taking a heavily Ajax-driven, fairly inaccessible Rails page and transforming it to an accessible, unobtrusive one.

We start with a simple todo list application that uses the traditional Rails Javascript helpers. You can [download the original application from here](http://jlaine.net/assets/2007/8/6/obtrusive.zip).

![Todo list app](http://jlaine.net/assets/2007/8/6/todo-shot_1.png "Todo list app")

The index page of the items controller is very simple:

```
<code class="builder"><% form_for :item, :url => items_path do |f| %>

<h3>
  Not done:
</h3>

<ul id="undone">
  <%= render :partial => "item", :collection => @not_done %>
</ul>

<h3>
  Done:
</h3>

<ul id="done">
  <%= render :partial => "item", :collection => @done %>
</ul>

<% end %>

<p>
  <%= link_to_function "Add new item", "$('add_form').toggle()" %>
</p>

<% remote_form_for :item, @new_item, :url => items_path,
   :html => {:id => "add_form", :style => "display: none;"} do |f| %>
  New item:
  <%= f.text_field :description %>
  <input type="submit" value="Add item">
<% end %>
</code>
```

We'll take a closer look at the partials later, but let's begin with the lower part of the page. There are two kinds of Rails JS helpers used. First, the `link_to_function` to implement toggling the visibility of the form for adding new items, and second, the `remote_form_for` for the actual form.

This is how the source looks to a browser:

```
<code class="html"><p>
  <a href="#" onclick="$('add_form').toggle(); return false;">Add new item</a>
</p>

<form action="/items" id="add_form" method="post" onsubmit="new
  Ajax.Request('/items', {asynchronous:true, evalScripts:true,
  parameters:Form.serialize(this)}); return false;" style="display: none;">
  New item:
  <input id="item_description" name="item[description]" size="30" type="text" />

  <input type="submit" value="Add item">
</form>
</code>
```

Above, the anchor tag is both inaccessible and obtrusive. Without Javascript support, nothing happens when you click the resulting link. The Javascript behaviour is also placed right into the tag.

The form tag has a normal action attribute, so it's perfectly accessible, as long as the backend supports receiving the form submit without XmlHttpRequest. However, the tag is at least as obtrusive as the link, having the whole `Ajax.Request` call in the `onsubmit` event handler.

Let's now make the parts accessible, starting with the link. First of all, we'll want to make sure the link works even without Javascript. For that, we'll modify the helper call to just use the normal link_to.

```
<code class="ruby"><%= link_to "Add new item", new_item_path %>
</code>
```

If we now click the link, it will bring us... nowhere. We don't have a new action in our controller. Let's create a template (new.rhtml) for it real quick. We don't even need to add the action to the controller:

```
<code class="ruby"><%= render :partial => "form" %>
</code>
```

We already have the form in the index template, so let's move it to the partial (\_form.rhtml) from there...

```
<code class="ruby"><% remote_form_for :item, @new_item, :url => items_path, :html => {:id => "add_form", :style => "display: none;"} do |f| %>
  New item:
  <%= f.text_field :description %>
  <input type="submit" value="Add item">
<% end %>
</code>
```

...and replace it in index.rhtml with a similar render call we just added to new.rhtml.

If we now click the link again, we get to the new page and see...still nothing. It's because the form is invisible. We don't want that, so let's remove the style attribute from the form partial. We also don't want the form to be a remote form by default anymore, it wouldn't work well within the separate new page:

```
<code class="ruby"><% form_for :item, @new_item, :url => items_path, :html => {:id => "add_form"} do |f| %>
  New item:
  <%= f.text_field :description %>
  <input type="submit" value="Add item">
<% end %>
</code>
```

We can try to create a new item now but we'll get some weird stuff back. Our create action only has an RJS template so far. Let's change the create action in items_controller.rb a bit so that it redirects in case of normal http request:

```
<code class="ruby">respond_to do |wants|
  wants.html do
    redirect_to items_path
  end
  wants.js
end
</code>
```

Now creating new items from the new action should work fine.

### Progressive Enhancement

We have now ensured that adding items works without Javascript and can thus start the progressive enhancement phase. For it, we need the Low Pro javascript library.

Check the code out somewhere on your hard drive:

```
svn co http://svn.danwebb.net/external/lowpro/trunk lowpro
```

And copy the dist/lowpro.js and the behaviours subfolder to your app folder

```
cp dist/lowpro.js behaviours/*.js [path to your app]/public/javascripts/
```

We also need to update prototype to it's latest version. Download <http://prototypejs.org/assets/2007/6/20/prototype.js> and replace the prototype.js in your app with it.

Now you need to load all the needed Javascripts in the layout file (app/views/layouts/items.rhtml):

```
<code class="ruby"><%= javascript_include_tag :defaults, 'lowpro', 'remote' %>
</code>
```

We also need a way to pass certain javascript includes for specific pages. We can do this by using the `content_for` mechanism in Rails. Put the following into the head of your layout template:

```
<code class="ruby"><%= yield :javascript %>
</code>
```

Then add the following to your index.rhtml template

```
<code class="ruby"><% content_for :javascript do %>
  <%= javascript_include_tag "items_index" %>
<% end %>
</code>
```

This makes the index action to load the Javascript file that is particular to it:

```
<code class="html"><script src="/javascripts/items_index.js" type="text/javascript"></script>
</code>
```

Now create the items_index.js file in your app's public/javascripts folder and we're ready to roll!

We're using the excellent Event.addBehaviour method in Low Pro to attach behaviours to elements on our page. First of all, we want the form to be hidden when the page loads (remember we removed the css attribute from the element a few lines ago). This makes sure that users who have CSS working but Javascript not can still see the form.

```
<code class="javascript">Event.addBehavior({
  '#add_form' : function() {
    this.hide();
  }
});
</code>
```

Here, we target the form element by its id and then attach a function to it hiding the form. Note that addBehaviour always passes the actual element to the function as `this`, so it's easy to call methods for that element directly.

Next, we want to make clicking the "Add new item" link to show the form. We need to first add an id to the link and then attach a behaviour to its click event.

```
<code class="ruby"><%= link_to "Add new item", new_item_path, :id => "add_new_link" %>
</code>
```

```
<code class="javascript">Event.addBehavior({
  '#add_form' : function() {
    this.hide();
  },
  '#add_new_link:click' : function() {
    $('add_form').toggle();
    return false;
  }
});
</code>
```

Note how the actual event is separated by a colon from the element id reference. The same way works for all Javascript events, such as *submit*, *focus* and *blur*.

We must remember to make the attached function return false in the end, otherwise browsers will follow through the link (just like would happen if the code was inside an `onclick` inline event handler).

Ok, our link is now both accessible and unobtrusive. For Javascipt-handicapped it works as a normal link, and for the majority of the users it shows the form inline on the current page.

Next thing to do is to make the form Ajax'ed again by [Hijacking](http://domscripting.com/blog/display/41) it, in Jeremy Keith's terms.

```
<code class="javascript">Event.addBehavior({
  '#add_form' : function() {
    this.hide();
  },
  '#add_new_link:click' : function() {
    $('add_form').toggle();
    return false;
  },
  '#add_form' : Remote.Form
});
</code>
```

Hold it! What's that? We're not attaching a function to the element anymore. Remote.Form is a *Low Pro behaviour class*, a fairly recent addition in the library. Behaviour classes can be used to encapsulate common behaviour that you would put into an attached function inside `addBehaviour`. `Remote.Form` and `Remote.Link` are good examples of behaviour that is pretty much the same all the time. They will automatically hijack a form or link respectively, and make them use Ajax. We could specify a bunch of attributes to the calls, but most of the time *they just work*, getting all the needed info from the actual *form* and *a* elements.

However, we now have one problem. Since we're attaching another behaviour to #add_form already, the latter will override the first one and the form is not hidden on the page. We could overcome this by writing our own behaviour class. However, we will take a short cut here and hide the form when the body is loaded, instead:

```
<code class="javascript">Event.addBehavior({
  'body' : function() {
    $('add_form').hide();
  },
  '#add_new_link:click' : function() {
    $('add_form').toggle();
    return false;
  },
  '#add_form' : Remote.Form
});
</code>
```

Ta-da! Our link and form now work just like they did in the beginning. However, now the code works even when JS is turned off. The produced HTML now looks like this:

```
<code class="html"><p>
  <a href="/items/new" id="add_new_link">Add new item</a>
</p>

<form action="/items" id="add_form" method="post">
New item:
<input id="item_description" name="item[description]" size="30" type="text" />
<input type="submit" value="Add item">
</form>
</code>
```

Isn't that just beautiful?

This is a good time to have a short break and digest what you've learned so far. In the next installment, we'll tackle the select box lists of todo items and see how you can unobtrusively attach behaviours to multiple elements with very small amount of code.

Now, continue to the [next part of the series](http://jlaine.net/2008/9/9/from-rails-ajax-helpers-to-low-pro-part-3-some-announcements).
