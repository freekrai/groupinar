'use strict'
const Webinar = use('App/Model/Webinar')
const RandomString = use('randomstring')
class WebinarController {

	* index(request, response){
		const webinars = yield Webinar.query().where('user_id', request.currentUser.id).fetch()
		yield response.sendView('talk.user_talks', { webinars: webinars.toJSON() })
	}

	* token(request, response){
		// if logged in, we use their identity...
		if( request.currentUser ){
			const user = request.currentUser
			var identity = user.username;
		}else{
			var identity = RandomString.generate({ length: 10, capitalization: 'uppercase' });
		}

		var token = new request.twilioClient.AccessToken(
			process.env.TWILIO_ACCOUNT_SID,
			process.env.TWILIO_API_KEY,
			process.env.TWILIO_API_SECRET
		);
		token.identity = identity;
		token.addGrant( new request.twilioClient.VideoGrant() );
		if (process.env.TWILIO_SYNC_SERVICE_SID) {
			token.addGrant( new request.twilioClient.SyncGrant({
				serviceSid: process.env.TWILIO_SYNC_SERVICE_SID
    		}));
		}
		if( process.env.TWILIO_CHAT_SERVICE_SID ){
			token.addGrant( new request.twilioClient.ChatGrant({
	      		serviceSid: process.env.TWILIO_CHAT_SERVICE_SID
	    	}));
		}
		response.send({
			identity: identity,
			token: token.toJwt()
		});
	}

	* new(request, response){
		yield response.sendView('talk.create');
	}

	* newsave(request, response){
		const user = request.currentUser

        // validate form input
        const validation = yield Validator.validateAll(request.all(), {
            title: 'required'
        })

        // show error messages upon validation fail
        if (validation.fails()) {
            yield request.withAll().andWith({ errors: validation.messages() }).flash()
            return response.redirect('back')
        }

        // persist ticket to database
        const webinar = yield Webinar.create({
            title: request.input('title'),
            user_id: user.id,
            slug: RandomString.generate({ length: 10, capitalization: 'uppercase' })
        })

        yield request.with({ status: `A webinar with ID: #${webinar.slug} has been created.` }).flash()
        response.redirect('back')
	}

	* host(request, response){
		var slug = request.param('slug');
		var webinar = yield Webinar.query().where('slug', slug).fetch();
/*
		Twilio.Video.connect('$TOKEN', {name:'my-new-room'}).then(function(room) {
			console.log('Successfully joined a Room: ', room);
			room.on('participantConnected', function(participant) {
				console.log('A remote Participant connected: ', participant);
			})
		}, function(error) {
			console.error('Unable to connect to Room: ' +  error.message);
		});
*/
		yield response.sendView('talk.host', {
			slug: slug,
			talk: webinar.toJSON()
		})
	}
	* guest(request, response){
		var slug = request.param('slug');
		var webinar = yield Webinar.query().where('slug', slug).fetch();
		yield response.sendView('talk.guest', {
			slug: slug,
			talk: webinar.toJSON()
		})
	}
}

module.exports = WebinarController
