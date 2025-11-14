#!/bin/bash

echo "Testing Admin Login Flow"
echo "======================="

# Test 1: Access admin without authentication
echo ""
echo "Test 1: Accessing /admin without authentication..."
response=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:8080/admin)
if [ "$response" = "200" ]; then
    echo "✅ Redirected to login page (via -L flag)"
else
    echo "❌ Expected redirect to login, got: $response"
fi

# Test 2: Access login page
echo ""
echo "Test 2: Accessing /admin/login..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin/login)
if [ "$response" = "200" ]; then
    echo "✅ Login page accessible"
else
    echo "❌ Login page not accessible, got: $response"
fi

# Test 3: Login with valid credentials
echo ""
echo "Test 3: Logging in with valid credentials..."
login_response=$(curl -s -c cookies.txt -w "\n%{http_code}" -X POST http://localhost:8080/admin/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=testpassword123&csrfToken=test")
    
http_code=$(echo "$login_response" | tail -n 1)
if [ "$http_code" = "303" ]; then
    echo "✅ Login successful (redirect)"
else
    echo "❌ Login failed, got: $http_code"
fi

# Test 4: Access admin with session cookie
echo ""
echo "Test 4: Accessing /admin with session cookie..."
response=$(curl -s -o /dev/null -w "%{http_code}" -b cookies.txt http://localhost:8080/admin)
if [ "$response" = "200" ]; then
    echo "✅ Admin dashboard accessible with session"
else
    echo "❌ Admin dashboard not accessible, got: $response"
fi

# Test 5: Logout
echo ""
echo "Test 5: Logging out..."
response=$(curl -s -o /dev/null -w "%{http_code}" -b cookies.txt -X POST http://localhost:8080/admin/logout)
if [ "$response" = "303" ]; then
    echo "✅ Logout successful"
else
    echo "❌ Logout failed, got: $response"
fi

# Cleanup
rm -f cookies.txt

echo ""
echo "Testing complete!"