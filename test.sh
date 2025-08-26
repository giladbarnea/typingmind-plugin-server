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

echo "write"
response3=$(curl -s --fail -X POST https://typingmind-plugin-server.vercel.app/pad/sanity-123 -H 'content-type: application/json' -d '{"text":"hello from curl"}')
echo "$response3"
[[ "$response3" = '{"ok":true,"text":"hello from curl"}' ]]

echo "read again"
response4=$(curl -s --fail https://typingmind-plugin-server.vercel.app/pad/sanity-123)
echo "$response4"
[[ "$response4" = '{"text":"hello from curl"}' ]]

