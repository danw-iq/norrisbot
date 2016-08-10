/*# norrisbot main content*/

/* 	author: Dan Wilcox
	Tutorial from Scotch.io
	URL: https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers 

	Note: I've added methods to include groups (private channels). Original code was focused only on channels.
*/

'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var NorrisBot = function Constructor(settings){

	this.settings = settings;
	this.settings.name = this.settings.name || 'norrisbot';
	this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');

	this.user = null;
	this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

module.exports = NorrisBot;

NorrisBot.prototype.run = function () {
	NorrisBot.super_.call(this, this.settings);

	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};


//** When NorrisBot first starts up, perform the following actions **//
NorrisBot.prototype._onStart = function(){
	
	this._loadBotUser();
	this._connectDb();
	this._firstRunCheck();
};

// Load all the metadata related to the user representing the bot itself on the current Slack organization
NorrisBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

//Connect to the SQLite database
NorrisBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

//Check if it’s the first time the bot is executed and if so send a greeting messages to all the users
NorrisBot.prototype._firstRunCheck = function () {
    var self = this;
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

//State this when the bot first runs
NorrisBot.prototype._welcomeMessage = function () {
	if (this.channels[0].name != null){
		this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
	} else {
		this.postMessageToChannel(this.groups[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
	}
    
};


//** When NorrisBot receives a message, perform the following actions **//


//intercepts every real time message that is readable by NorrisBot
NorrisBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromNorrisBot(message) &&
        this._isMentioningChuckNorris(message)
    ) {
        this._replyWithRandomJoke(message);
    } 
};

//checks if a real time event corresponds to a message sent by a user
NorrisBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};


//verifies if the message is directed to a channel or group
NorrisBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        ( (message.channel[0] === 'C') || (message.channel[0] === 'G' ) );
};


/* 
	see if the message comes from a user who is not the NorrisBot itself.
	Note: This prevents an infinite loop of Chuck Norris jokes
*/

NorrisBot.prototype._isFromNorrisBot = function (message) {
    return message.user === this.user.id;
};


//see whether the text message mentions Chuck Norris or NorrisBot
NorrisBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};


//extracts a joke at random from the database and posts it in the channel where the original message was written
NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
	
    var self = this;
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);

        // hacky code to determine if this is a group, and not a channel
        if (channel == null){
        	channel = self._getGroupById(originalMessage.channel);
        	self.postMessageToGroup(channel.name, record.joke, {as_user: true}); 
        } else {
        	 self.postMessageToChannel(channel.name, record.joke, {as_user: true}); 
        }

        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};



//retrieve the name of the channel given its ID
NorrisBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
    	
        return item.id === channelId;
    })[0];
};

//retrieve the name of the group given its ID
NorrisBot.prototype._getGroupById = function (groupId){
	 return this.groups.filter(function (item) {
    	
        return item.id === groupId;
    })[0];

}
