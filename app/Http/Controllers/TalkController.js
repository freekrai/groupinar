'use strict'

const Webinar = use('App/Model/Webinar')

class TalkController {
	* sendsms (request, response) {
		request.twilioClient.client.messages.create({
		    to: "2504861027",
		    from: request.twilioClient.fromNumber,
		    body: "This is the ship that made the Kessel Run in fourteen parsecs?",
		}, function(err, message) {
//		    console.log(message.sid);
		});
		yield response.sendView('home')
	}
}

module.exports = TalkController
