'use strict'
const Twilio = require('twilio')
const Env = use('Env')

const client = new Twilio( Env.get('TWILIO_ACCOUNT_SID', null), Env.get('TWILIO_AUTH_TOKEN', null) );
const AccessToken = require('twilio').jwt.AccessToken;
const fromNumber = Env.get('TWILIO_FROM_NUMBER', null);

class TwilioMiddleware {
	* handle (request, response, next) {
		request.twilioClient = {
			client: client,
			AccessToken: AccessToken,
			fromNumer: fromNumber
		};
		yield next
	}
}

module.exports = TwilioMiddleware
