#!/bin/bash
set -e

echo "hi"
curl -i https://typingmind-plugin-server.vercel.app/hi ;

echo "first read"
curl -i https://typingmind-plugin-server.vercel.app/pad/sanity-123 ; 

echo "write"
curl -i -X POST https://typingmind-plugin-server.vercel.app/pad/sanity-123 -H 'content-type: application/json' -d '{"text":"hello from curl"}' ;

echo "read again"
curl -i https://typingmind-plugin-server.vercel.app/pad/sanity-123 ;

