# norrisbot
norris bot for slack

A custom bot I built for Slack based on the tutorial from [Scotch.io](https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers).

In that article, they detail the steps to build a custom Slack bot using NodeJs, with the jokes stored on a SQLite database. 

I deviated a bit, where I call an API from the [Internet Chuck Norris Database](http://www.icndb.com/api/). 

However, I still kept the original SQLite Database in case you want to use their code. All you need to do is uncomment the lines in /bin/bot.js and comment the appropriate lines to hide danbot.js.
