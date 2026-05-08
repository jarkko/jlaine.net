---
layout: post
title: Making Globalize play nice with specs
---

We're using [Globalize](http://www.globalize-rails.org/globalize/) for our latest Rails project and I just ran against a problem when running specs with rake.

We specify the base language and the locales our app supports in environment.rb:

```
<code class="ruby">include Globalize
Locale.set_base_language('en-US')
SupportedLocales.define(['fi-FI', 'sv-SE', 'en-US'], 'en-US')
</code>
```

However, `SupportedLocales.define` expects that the language and country data exists in the database, otherwise it will die miserably. Of course, when you run specs with rake, it will wipe the database as its first action so you're pretty much out of luck:

```
.../vendor/plugins/globalize/lib/globalize/localization/supported_locales.rb:282:in `setup': Globalize base language undefined! (RuntimeError)
```

I fixed this by copying the `db:test:clone` rake task from `[RAILS]/railties/lib/tasks/databases.rake` to its own file in `lib/tasks` and modifying it so that it will load some language and country fixtures automatically:

```
<code class="ruby">require(File.join(RAILS_ROOT, 'vendor', 'rails', 'activerecord', 'lib', 'active_record', 'fixtures'))

namespace :db do
  namespace :test do
    desc "Recreate the test database from the current environment's database schema"
    task :clone => %w(db:schema:dump db:test:purge) do
      ActiveRecord::Base.establish_connection(ActiveRecord::Base.configurations['test'])
      ActiveRecord::Schema.verbose = false
      Rake::Task["db:schema:load"].invoke
      Fixtures.create_fixtures("#{RAILS_ROOT}/spec/fixtures", [:globalize_countries, :globalize_languages])
    end
  end
end
</code>
```

The only thing differing from the original task is the last line creating the fixtures. For some reasons I also need to explicitly require the fixtures file on the top of the file. Aside from this, I needed to change Rakefile in the root of our Rails app to require `config/environment.rb` instead of `config/boot.rb` for everything to work.

Of course your fixture files need to include all the languages and countries you're specifying in your `SupportedLocales.define` call.

After these modifications, rake runs through fine again.
