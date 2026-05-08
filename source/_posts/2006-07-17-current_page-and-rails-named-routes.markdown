---
layout: post
title: current_page? and Rails named routes
---

[current_page?](http://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#M000386) is a nifty Rails helper that can be used to check whether a URL points to the current page. This is very useful in navigation lists where you'd want the link to the current page to be styled differently from other items. However, if you're using [named routes](http://wiki.rubyonrails.org/rails/pages/NamedRoutes) in Rails (and you should, keep it DRY, man), `current_page?` doesn't work correctly. The reason for this is that `request.request_uri` (which `current_page?` uses internally to get the current URL) doesn't contain the domain name, whereas `your_named_route_url``<sup>`{=html}`<a href="#fn1">`{=html}1`</a>`{=html}`</sup>`{=html} will return the whole URL, including the domain name and the port.

While this small incompatibility is being fixed, you can circumvent it by using `hash_for_your_named_route_url` instead. It is just about the same magical method as `your_named_route_url`, with one difference. It returns the params hash instead of running it through `url_for` and returning the URL as a string. Thus `current_page?` will work happily with it.

```

map.your_named_route '', :controller => 'default', :action => 'index'
```
