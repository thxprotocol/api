#!/usr/bin/bash
kill $(lsof -t -i :7545) || echo 'No process running on port 7545'
npx ganache-cli -p 7545  -q --account=\"0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709,1000000000000000000000000000000000000000\" > /dev/null & sleep 5
node ./scripts/deployGasStation.js
