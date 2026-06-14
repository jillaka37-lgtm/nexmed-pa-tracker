#!/bin/bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /Users/zhilarahimi/Desktop/Nexmed || exit 1
exec node node_modules/next/dist/bin/next dev --port 3000
