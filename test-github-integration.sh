#!/bin/bash

# Test script for GitHub integration
# This script verifies that the GitHub integration is working correctly

echo "GitHub Integration Test"
echo "======================="
echo ""

# Check if .env exists and has GitHub token
if [ -f .env ]; then
    source .env
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set"
    echo "   Run ./setup-github-token.sh first"
    exit 1
fi

echo "Testing GitHub API access..."
echo ""

# Test 1: Verify token works
echo "1. Testing authentication..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user)

if [ "$RESPONSE" = "200" ]; then
    echo "   ✅ Authentication successful"
else
    echo "   ❌ Authentication failed (HTTP $RESPONSE)"
    exit 1
fi

# Test 2: Check repository access
echo "2. Testing repository access..."
REPO_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_OWNER:-joelklabo}/${GITHUB_REPO:-KlaboWorld}")

if [ "$REPO_RESPONSE" = "200" ]; then
    echo "   ✅ Repository accessible"
else
    echo "   ❌ Cannot access repository (HTTP $REPO_RESPONSE)"
    echo "   Check GITHUB_OWNER and GITHUB_REPO settings"
    exit 1
fi

# Test 3: List existing posts
echo "3. Listing posts in repository..."
POSTS=$(curl -s \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_OWNER:-joelklabo}/${GITHUB_REPO:-KlaboWorld}/contents/Resources/Posts" \
    | grep -o '"name":"[^"]*\.md"' | cut -d'"' -f4)

if [ -n "$POSTS" ]; then
    echo "   ✅ Found posts:"
    echo "$POSTS" | head -5 | sed 's/^/      - /'
    POST_COUNT=$(echo "$POSTS" | wc -l | tr -d ' ')
    if [ "$POST_COUNT" -gt 5 ]; then
        echo "      ... and $((POST_COUNT - 5)) more"
    fi
else
    echo "   ⚠️  No posts found (this might be okay for a new blog)"
fi

# Test 4: Check write permissions
echo "4. Testing write permissions..."
TEST_PATH="Resources/Posts/.github-test-$(date +%s).md"
TEST_CONTENT="# Test Post\nThis is a test post to verify GitHub integration."

WRITE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GITHUB_OWNER:-joelklabo}/${GITHUB_REPO:-KlaboWorld}/contents/$TEST_PATH" \
    -d "{
        \"message\": \"Test: Verify GitHub integration\",
        \"content\": \"$(echo -n "$TEST_CONTENT" | base64)\"
    }")

if [ "$WRITE_RESPONSE" = "201" ] || [ "$WRITE_RESPONSE" = "200" ]; then
    echo "   ✅ Write permissions confirmed"
    
    # Clean up test file
    echo "5. Cleaning up test file..."
    
    # Get SHA of test file
    SHA=$(curl -s \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${GITHUB_OWNER:-joelklabo}/${GITHUB_REPO:-KlaboWorld}/contents/$TEST_PATH" \
        | grep -o '"sha":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$SHA" ]; then
        DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            -X DELETE \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${GITHUB_OWNER:-joelklabo}/${GITHUB_REPO:-KlaboWorld}/contents/$TEST_PATH" \
            -d "{
                \"message\": \"Test: Clean up test file\",
                \"sha\": \"$SHA\"
            }")
        
        if [ "$DELETE_RESPONSE" = "200" ]; then
            echo "   ✅ Test file cleaned up"
        else
            echo "   ⚠️  Could not clean up test file (HTTP $DELETE_RESPONSE)"
        fi
    fi
else
    echo "   ❌ Cannot write to repository (HTTP $WRITE_RESPONSE)"
    echo "   Check that your token has 'repo' scope"
    exit 1
fi

echo ""
echo "======================="
echo "All tests passed! ✅"
echo "======================="
echo ""
echo "Your GitHub integration is working correctly."
echo "You can now:"
echo "- Create posts via the admin interface at /admin/compose"
echo "- Edit existing posts at /admin/posts/[slug]/edit"
echo "- Delete posts from the admin dashboard"
echo ""
echo "All changes will be committed to GitHub and automatically deployed."