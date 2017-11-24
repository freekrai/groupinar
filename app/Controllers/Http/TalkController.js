'use strict'
const Env = use('Env')
const RandomString = use('randomstring')

const AccessToken = require('twilio').jwt.AccessToken;

class TalkController {
	async token ({ params, response }) {
		var identity = RandomString.generate({ length: 10, capitalization: 'uppercase' });

		const VideoGrant = AccessToken.VideoGrant;

		var token = new AccessToken(
			Env.get('TWILIO_ACCOUNT_SID', null),
			Env.get('TWILIO_API_KEY', null),
			Env.get('TWILIO_API_SECRET', null)
		);
		token.identity = identity;
		token.addGrant( new VideoGrant() );
		return response.send({
			identity: identity,
			token: token.toJwt()
		});
	}

	async host ({ params, view }) {
		const slug = params.slug;
		return view.render('talk', {
			slug: slug,
			pageTitle: "Green room",
			hostOrGuest: "1"
		})
	}

	async guest ({ params, view }) {
		const slug = params.slug;
		return view.render('talk', {
			slug: slug,
			pageTitle: "Guest",
			hostOrGuest: "0"
		})
	}
}

module.exports = TalkController