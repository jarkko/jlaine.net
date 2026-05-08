---
layout: post
title: Rails tip for today
---

Caching is turned off by default in the development environment. If you want to try it out before switching to full production mode, change the following line in `[yourapp]/config/environments/development.rb`:

```
ActionController::Base.perform_caching = false
```

to

```
ActionController::Base.perform_caching = true
```
