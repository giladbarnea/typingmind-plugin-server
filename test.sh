#!/bin/bash
set -e

echo "hi"
response1=$(curl -s --fail https://typingmind-plugin-server.vercel.app/hi)
echo "$response1"
[[ "$response1" = '{"ok":true}' ]]

echo "first read"
response2=$(curl -s --fail https://typingmind-plugin-server.vercel.app/pad/sanity-123)
echo "$response2"
[[ "$response2" = '{"text":""}' ]]

# Generate a short random string
rand=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 8)
echo "Using random string: $rand"

echo "write"
response3=$(curl -s --fail -X POST https://typingmind-plugin-server.vercel.app/pad/sanity-123 -H 'content-type: application/json' -d "{\"text\":\"hello from curl $rand\"}")
echo "$response3"
[[ "$response3" = "{\"ok\":true,\"text\":\"hello from curl $rand\"}" ]]

echo "read again"
response4=$(curl -s --fail https://typingmind-plugin-server.vercel.app/pad/sanity-123)
echo "$response4"
[[ "$response4" = "{\"text\":\"hello from curl $rand\"}" ]]

