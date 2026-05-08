#!/usr/bin/env ruby
# Converts Octopress-era Textile posts to Markdown via Pandoc.
# Strategy:
#   1. Extract YAML front matter.
#   2. Stash <pre>…</pre> code blocks as opaque placeholders.
#   3. Convert the remaining Textile body through Pandoc.
#   4. Reinstate code blocks as fenced Markdown.
#   5. Write output with .markdown extension, zero-padding the date slug.

require 'open3'

POSTS_DIR = File.join(__dir__, '..', 'source', '_posts')

def convert_file(textile_path)
  raw = File.read(textile_path, encoding: 'utf-8')

  # ---- 1. Extract YAML front matter ---------------------------------------
  front_matter = ''
  body = raw
  if raw =~ /\A(---\s*\n.*?\n---\s*\n)(.*)\z/m
    front_matter = $1
    body = $2
  end

  # ---- 2. Stash code blocks -----------------------------------------------
  code_blocks = []   # store raw code text
  placeholder = ->(code) {
    idx = code_blocks.size
    code_blocks << code.sub(/\A\n/, '').rstrip
    "XCODEBLOCKX#{idx}X"
  }

  # <pre><code>...</code></pre>
  body = body.gsub(%r{<pre><code>(.*?)</code></pre>}m) { placeholder.call($1) }
  # <pre>...</pre>  (without inner <code>)
  body = body.gsub(%r{<pre>(.*?)</pre>}m) { placeholder.call($1) }

  # ---- 3. Pre-process inline <code> → Textile @...@ ----------------------
  body = body.gsub(/<code>([^<\n]+)<\/code>/) { "@#{$1.gsub('@', '&#64;')}@" }

  # ---- 4. Run Pandoc (Textile → Markdown) ---------------------------------
  markdown_body, stderr, status = Open3.capture3(
    'pandoc', '-f', 'textile', '-t', 'markdown', '--wrap=none',
    stdin_data: body
  )
  unless status.success?
    warn "Pandoc failed for #{textile_path}: #{stderr}"
    return false
  end

  # ---- 5. Post-process Pandoc output --------------------------------------
  # Restore &#64; back to @ inside code spans
  markdown_body = markdown_body.gsub('&#64;', '@')

  # Reinstate stashed code blocks
  code_blocks.each_with_index do |code, idx|
    escaped_code = "```\n#{code}\n```"
    markdown_body = markdown_body.sub("XCODEBLOCKX#{idx}X", escaped_code)
  end

  # Strip trailing whitespace
  markdown_body = markdown_body.lines.map(&:rstrip).join("\n").strip + "\n"

  # ---- 6. Reassemble and write output file --------------------------------
  output = front_matter + "\n" + markdown_body

  # Zero-pad date in filename: 2005-3-9-title → 2005-03-09-title
  basename = File.basename(textile_path, '.textile').sub(
    /^(\d{4})-(\d{1,2})-(\d{1,2})-/
  ) { "#{$1}-#{$2.rjust(2,'0')}-#{$3.rjust(2,'0')}-" }

  out_path = File.join(File.dirname(textile_path), "#{basename}.markdown")
  File.write(out_path, output, encoding: 'utf-8')
  puts "  OK  #{File.basename(out_path)}"
  true
rescue => e
  warn "  ERR #{File.basename(textile_path)}: #{e.message}"
  false
end

textile_files = Dir.glob(File.join(POSTS_DIR, '*.textile')).sort
puts "Converting #{textile_files.size} Textile posts…"
ok = 0; fail = 0
textile_files.each { |f| convert_file(f) ? ok += 1 : fail += 1 }
puts "\nDone: #{ok} converted, #{fail} failed."
puts "Review the .markdown files, then delete the .textile sources."
