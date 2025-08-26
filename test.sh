#!/bin/bash
set -e
set -a
. .env.local
set +a

rand=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 4)
echo " ✦ Using random string: $rand"

echo " ✦ GET /hi..."
response1=$(curl -s --fail https://typingmind-plugin-server.vercel.app/hi)
printf " ✦ → %s " "$response1"
[[ "$response1" = '{"ok":true}' ]]
printf "✔\n"

echo " ✦ First GET /pad/sanity-$rand..."
response2=$(curl -s --fail https://typingmind-plugin-server.vercel.app/pad/sanity-$rand)
printf " ✦ → %s " "$response2"
[[ "$response2" = '{"text":""}' ]]
printf "✔\n"


echo " ✦ POST /pad/sanity-$rand..."
response3=$(curl -s --fail -X POST https://typingmind-plugin-server.vercel.app/pad/sanity-$rand -H 'content-type: application/json' -d "{\"text\":\"hello from curl $rand\"}")
printf " ✦ → %s " "$response3"
[[ "$response3" = "{\"ok\":true,\"text\":\"hello from curl $rand\"}" ]]
printf "✔\n"

echo " ✦ Second GET /pad/sanity-$rand..."
response4=$(curl -s --fail https://typingmind-plugin-server.vercel.app/pad/sanity-$rand)
printf " ✦ → %s " "$response4"
[[ "$response4" = "{\"text\":\"hello from curl $rand\"}" ]]
printf "✔\n"

