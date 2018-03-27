'use strict'
const Env = use('Env')
const RandomString = use('randomstring')

var Twilio = use('twilio')
var client = new Twilio(
	Env.get('TWILIO_API_KEY', null), 
	Env.get('TWILIO_API_SECRET', null), {
		accountSid: Env.get('TWILIO_ACCOUNT_SID', null)
	});

const AccessToken = use('twilio').jwt.AccessToken;

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
		//	if a room exists, return the info, otherwise, create one.
		const slug = params.slug;
		return client.video.rooms( slug ).fetch().then( (room) => {
			return view.render('talk', {
				slug: slug,
				pageTitle: "Green room",
				hostOrGuest: "on"
			})
		}).catch( err => {
			return client.video.rooms.create({
				uniqueName: slug,
			}).then( room => {
				return view.render('talk', {
					slug: slug,
					pageTitle: "Green room",
					hostOrGuest: "on"
				})
			});
		});
	}

	async guest ({ params, view }) {
		//	if a room exists, return the info, otherwise, create one.
		const slug = params.slug;
		return client.video.rooms( slug ).fetch().then( (room) => {
			return view.render('talk', {
				slug: slug,
				pageTitle: "Guest",
				hostOrGuest: "off"
			})
		}).catch( err => {
			return client.video.rooms.create({
				uniqueName: slug,
			}).then( room => {
				return view.render('talk', {
					slug: slug,
				pageTitle: "Guest",
				hostOrGuest: "off"
				})
			});
		});
	}

module.exports = TalkController
