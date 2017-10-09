'use strict'
const Twilio = require('twilio')
const Env = use('Env')

const client = new Twilio( Env.get('TWILIO_ACCOUNT_SID', null), Env.get('TWILIO_AUTH_TOKEN', null) );
const AccessToken = require('twilio').jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const VideoGrant = AccessToken.VideoGrant;
const SyncGrant = AccessToken.SyncGrant;
const fromNumber = Env.get('TWILIO_FROM_NUMBER', null);

class TwilioMiddleware {
	* handle (request, response, next) {
		request.twilioClient = {
			client: client,
			AccessToken: AccessToken,
			ChatGrant: ChatGrant,
			VideoGrant: VideoGrant,
			SyncGrant: SyncGrant,
			fromNumer: fromNumber
		};
		yield next
	}
}

module.exports = TwilioMiddleware
