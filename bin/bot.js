/*# bin/bot.js*/

'use strict'

var NorrisBot = require('../lib/norrisbot.js');

var token = process.env.BOT_API_KEY; /* 'xoxb-67883908689-l3wN8lBh5DcNsjMjF17HCbwL'; */
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;


//create an instance of norrisbot and run it
var norrisbot = new NorrisBot({
	token: token,
	dbPath: dbPath,
	name: name

});

norrisbot.run();