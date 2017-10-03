
##### VARIABLES #####

# SHELL defines the shell to use while executing recipes (default: /bin/sh)
SHELL=/bin/bash

# VPATH defines the search path for prerequisites
VPATH=doc

in_dir=doc
in_files=$(wildcard $(in_dir)/*.md)

out_dir=dist
out_files=$(subst $(in_dir)/,$(out_dir)/,$(subst .md,.html,$(in_files)))

fe_dir=src
fe_files=$(wildcard $(fe_dir)/*) package.json

# Templates & Temp files
template=$(in_dir)/template.html
body=$(in_dir)/body.html

# Commands
drfrank=bash drfrank.sh
pandoc=pandoc -f markdown -t html


##### RULES #####

# remake everything that needs to be updated frequently
default: $(out_dir) $(out_files) doc/about.md

# remake everything
all: $(out_dir) $(out_files) doc/about.md npm_build

# readme and about: same thing
doc/about.md: README.md
	cp -f README.md doc/about.md 

# Build doc pages
# targets: target-pattern: prereq-patterns
# $< is an auto var for the first prereq
# $* is an auto var for the stem ie %
$(out_files): $(out_dir)/%.html: $(in_dir)/%.md  $(template)

	$(pandoc) $< > $(body)
	cp -f $(template) $(out_dir)/$*.html
	sed -i '/<!--#include body-->/r '"$(body)" "$(out_dir)/$*.html"
	sed -i '/<!--#include body-->/d' "$(out_dir)/$*.html"
	rm $(body)

$(out_dir):
	mkdir -p $(out_dir)


npm_build: $(fe_files)
	npm install
	npm run build

.PHONY: clean
clean:
	rm -rf $(out_dir)/*




