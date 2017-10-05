'use strict'

const Webinar = use('App/Model/Webinar')

const Twilio = require('twilio')
const Env = use('Env')

const client = new Twilio(Env.get('TWILIO_ACCOUNT_SID', null), Env.get('TWILIO_AUTH_TOKEN', null) );
const fromNumber = Env.get('TWILIO_FROM_NUMBER', null);

class TalkController {
	* sendsms (request, response) {
		client.messages.create({
		    to: "2504861027",
		    from: fromNumber,
		    body: "This is the ship that made the Kessel Run in fourteen parsecs?",
		}, function(err, message) {
		    console.log(message.sid);
		});
		yield response.sendView('home')
	}
}

module.exports = TalkController
