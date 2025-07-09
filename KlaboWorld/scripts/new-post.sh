#!/bin/bash
# Script to create a new blog post with proper front matter

# Check if title was provided
if [ -z "$1" ]; then
    echo "Error: Please provide a title for the post"
    echo "Usage: $0 \"My Post Title\""
    exit 1
fi

TITLE="$1"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
FILENAME="Resources/Posts/${SLUG}.md"

# Check if file already exists
if [ -f "$FILENAME" ]; then
    echo "Error: Post with slug '$SLUG' already exists at $FILENAME"
    exit 1
fi

# Create the post file
cat > "$FILENAME" << EOF
---
title: $TITLE
summary: Brief description of your post
date: $DATE
publishDate: $DATE
tags: 
---

# $TITLE

Start writing your post content here...

## Section 1

Your content...

## Section 2

More content...

## Conclusion

Wrap up your post...
EOF

echo "✅ Created new post: $FILENAME"
echo ""
echo "Next steps:"
echo "1. Edit the post: $FILENAME"
echo "2. Update the summary and tags in the front matter"
echo "3. Write your content"
echo "4. Set publishDate to a future date if you want to schedule it"
echo ""
echo "To preview: make run"
echo "To publish: Push to git (if publishDate is today or past)"