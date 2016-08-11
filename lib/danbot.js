
/* ===============================================================================================================
	author: Dan Wilcox
	Original tutorial from Scotch.io
	URL: https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers 

	Note: I've added methods to include groups (private channels). Original code was focused only on channels.
	I've also changed the code from reading from a database to reading from an API instead.
=============================================================================================================== */

'use strict';

var http = require('https');
var util = require('util');
var Bot = require('slackbots');

var NorrisBot = function Constructor(settings){

	this.settings = settings;
	this.settings.name = this.settings.name || 'norrisbot';

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

	var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];

};



//** When NorrisBot receives a message, perform the following actions **//


//intercepts every real time message that is readable by NorrisBot
NorrisBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromNorrisBot(message) &&
        this._isMentioningChuckNorris(message)
    ) {
    	this._getJokes(message);
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


//extracts a random joke from Chuck Norris API (https://api.icndb.com/jokes/random) and posts it in the channel where the original message was written
NorrisBot.prototype._getJokes = function (message){

	var self = this;

	var options = {
	  "method": "GET",
	  "hostname": "api.icndb.com",
	  "path": "/jokes/random"
	}

	var req = http.request(options, function (res) {
		var chunks = [];

		res.on("data", function (chunk) {
			chunks.push(chunk);
		});

	  	res.on("end", function () {
	  		var body = (JSON.parse(chunks)).value.joke;

		  	// some lines have &quot;, so they need to be converted to ""
		   	if (body.indexOf("&quot") > -1){
		   		var swap = body.replace(/&quot;/g, '"');
		   		body = swap;
		   	}

	   		var channel = self._getChannelById(message.channel);

		    // hacky code to determine if this is either a slack group or a slack channel
		    if (channel == null){
		    	channel = self._getGroupById(message.channel);
		    	self.postMessageToGroup(channel.name, body, {as_user: true}); 
		    } else {
		    	 self.postMessageToChannel(channel.name, body, {as_user: true});
		    }
	    
	  	});
	});

	req.end();
}


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
