# Using Twilio Video to host your live webinars
Have you ever attended a virtual conference or webinar? People watch the presenters live as they talk and ask questions using a chat interface, it’s great.

Today, we’re going to use Twilio Video to create a system where a host can host a video, and viewers can watch the conference.

We’ll be using the Adonisjs framework for this as it’s great for building rapid applications.

AdonisJs is a full-stack, open-source MVC framework for node.js that was inspired by the Laravel framework and borrows some of its concepts. It saves you time and effort becauses it ships with a lot of features out of the box. 

This can be extended into a system that users  can sign up and schedule talks on, even pay to use. But we’re going to keep our system simple as it’s just an MVP really.

## What you need

### A twilio account

To get started, you’ll need a Twilio account so go ahead and sign up for one now if you haven’t already.

### What is Twilio Video?

We’ll be using [Twilio Video](https://www.twilio.com/video) to build our app. Twilio’s Video SDK is the fastest way to build a full featured WebRTC video solution across web, Android and iOS. We’ll be using the JavaScript interface but just think of how much fun it would be to extend this into a mobile app easily down the road.

Sign into your Twilio account and go to `Programmable Video`, under `Tools`, you’ll see an option for `API Keys` or [Click here](https://www.twilio.com/console/video/runtime/api-keys))

Create a new API Key, copy the API Key and the API Secret so you can use them in your app.

### Install node and adonis

Next, you’ll need to have Node.js and NPM installed, I recommend having node 8 installed.

Now install adonisjs:

```bash
npm i -g @adonisjs/cli
```

### See the code

You can follow along with the repo at [https://github.com/freekrai/groupinar](https://github.com/freekrai/groupinar)

**Ok, ready to really dive in?**

## Putting it all together

### Create your adonis app

Let’s create our video app:

```bash
adonis new group-video
```

This will create a folder named `group-video` which will contain code.

You can now test it:

```bash
cd group-video
adonis serve --dev
```

And you’ll see output:

```bash
[nodemon] starting `node server.js`
info adonis:framework serving app on http://localhost:3333
```

Open `http://localhost:3333` in your web browser and you’ll see the welcome page.

We want to add Twilio to our app, and we want to set up a middleware to handle our Twilio communications that way we only have to declare it once.

So, let’s add our modules  first:

```bash
npm i —save twilio randomstring
```

We want to add our Twilio configurations, so open `.env` from the project directory and add the following three lines:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_API_KEY=
TWILIO_API_SECRET=
```

### Create our Controller and set up our Routes

We want to create our controller, we can do this with our `adonis` command:

```bash
adonis make:controller Talk
```

It will prompt you to choose the controller type:

```bash
? Generating a controller for ? (Use arrow keys)
❯ Http Request
  For WebSocket Channel
```

Choose `Http Request`.

If you look in the `app/Controllers/Http/` folder, you’ll see you now have a file called `TalkController.js`.

In our editor, add the following two lines directly below the `’use strict`’ line:

```javascript
const Env = use('Env')
const RandomString = use('randomstring')
const AccessToken = require('twilio').jwt.AccessToken;
```

Now, inside the `TalkController` class, we want to add three new functions:

```javascript
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
```

In the `token` function, we called:

```javascript
var identity = RandomString.generate({ length: 10, capitalization: 'uppercase' });
```

This will assign each user, regardless of being a host or a guest with a unique random 10 digit name. If we were adding a

The other two functions are close in what they do, the difference is the `host` function sets the `hostOrGuest` variable to 1, and the `guest` function sets the `hostOrGuest` to 0. This will be used later in our view.

Now, open our `start/routes.js` file, and look for this line:

```javascript
Route.on('/').render('welcome')
```

Add these three new routes directly below it:

```javascript
Route.group(() => {
	Route.get('token','TalkController.token')
	Route.get('host/:slug', 'TalkController.host')
	Route.get(':slug', 'TalkController.guest')
}).prefix('talk')
```

We’ve created a route group, which tells our app that any route beginning with `/talk` is part of the group. The routes inside this group then line up with the three functions we created earlier:

- `/talk/token` will call the `token` function in `TalkController` and return our token for each user.
- `/talk/host/:slug` will call our `host` function, creating a room based on the `slug` we passed.
- `/talk/:slug` will call our `guest` function and display the room.

If you run your app now:

```bash
adonis serve --dev
```

You’ll be able to go to `http://localhost:3333/talk/token` and return a token.

### Creating our Views

What’s next? Next we need to create our `views` and make our video system do something.

```bash
adonis make:view talk
```

Will create a new file called `talk.edge` inside the `resources/views` folder. Edge is the template language used  by Adonis.

We’re only creating one view that will be used by both hosts and guests, the difference will be if we broadcast video or not.

```javascript
<html>
<head>
	<title>Group Video</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<link rel="stylesheet" href="https://bootswatch.com/4/sketchy/bootstrap.min.css">
</head>
<body>
	<div class="container">
		<br />
		<div class="alert alert-secondary" role="alert">
			<h4>{{ slug }} {{ pageTitle }}</h4>
			<p>http://localhost:3333/talk/{{ slug }}</p>
		</div>
		<div class="row">
			<div class="col-10">
			    <h3>Hosts</h3>
			    <div id="media-div"></div>
			</div>
			<div class="col-2">
				<h3>Attendees</h3>
				<div id="people" class="list-group">
			</div>
		</div>
	</div>
	<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
	<script src="https://media.twiliocdn.com/sdk/js/common/v0.1/twilio-common.min.js"></script>
	<script src="//media.twiliocdn.com/sdk/js/video/v1/twilio-video.min.js"></script>
	<script>
		var talk = {
			slug: "{{slug}}",
			host: {{hostOrGuest}}
		};
	</script>
	<script src="/app.js"></script>
</body>
</html>
```


This view sets up how we want our site to look, it will display videos on the left, and a list of attendees on the right.

Towards the bottom, you can see where we specify an object called `talk`, in this object we pass the chat room as `slug` and whether we are in host mode or not.

Ok, quick recap:

1. We’ve created our controller, and set up routing to said controller
2. We’ve set up our view to display our videos.
3. We’ve set up `app.js` to handle the actual communications right?

That’s right, we’ve got to set up the final piece of our application.

In the `public` folder, create a file called `app.js`:

```javascript
$(function() {
	if( typeof talk === "undefined" ) alert("please set your talk object");
	var username;
	var accessToken;
	var activeRoom;
	var previewTracks;
	var roomName = talk.slug;

	// Check for WebRTC
	if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
		alert('WebRTC is not available in your browser.');
	}

	window.addEventListener('beforeunload', leaveRoomIfJoined);

	$.getJSON('/talk/token', {
		device: 'browser'
	}, function(data) {
		accessToken = data.token;
		username = data.identity;
//	video....
		var video_options = {
			audo: false,
			video: false
		};
		if( talk.host == 1 ){
			video_options = {
				audio: true,
				video: { width: 300 }
			};
		}
		Twilio.Video.createLocalTracks(video_options).then(function(localTracks) {
			return Twilio.Video.connect(accessToken, {
				name: talk.slug,
				tracks: localTracks,
				video: { width: 300 }
			});
		}).then(function(room) {
			activeRoom = room;
			room.participants.forEach(participantConnected);
			var previewContainer = document.getElementById(room.localParticipant.sid);
			if (!previewContainer || !previewContainer.querySelector('video')) {
				participantConnected(room.localParticipant);
			}
			room.on('participantConnected', function(participant) {
				participantConnected(participant);
			});
			room.on('participantDisconnected', function(participant) {
				participantDisconnected(participant);
			});
		});
	});
```

In the first piece of our file, we’re calling that `/talk/token` route and getting a token that is allowed to use video, then we’re checking if `talk.host` was set to `1` for host  more, or `0` for guest mode.

If `host` is set to `0`, then we don’t enable video broadcasting and we just watch instead.

Next we tell Twilio to  connect to the room that is specified by `talk.slug`.

As part of this, we display any other video windows, and participants, and set up listeners to watch for connections and / or disconnections.

Now for the last part of the script, which  are the functions we call when participants join or leave:

```javascript
	function participantConnected(participant) {
		const div = document.createElement('div');
		div.id = participant.sid+"-video";
		div.setAttribute("style", "float: left; margin: 10px;");
		const div2 = document.createElement('a');
		div2.setAttribute("class", "list-group-item list-group-item-action");
		div2.id = participant.sid;
		div2.innerHTML = participant.identity;

		participant.tracks.forEach(function(track) {
			trackAdded(div, track)
		});
		participant.on('trackAdded', function(track) {
			trackAdded(div, track)
		});
		participant.on('trackRemoved', trackRemoved);
		document.getElementById('media-div').appendChild(div);
		document.getElementById('people').appendChild(div2);
	}
	function participantDisconnected(participant) {
		participant.tracks.forEach(trackRemoved);
		document.getElementById(participant.sid+"-video").remove();
		document.getElementById(participant.sid).remove();
	}
	function trackAdded(div, track) {
		div.appendChild(track.attach());
		var video = div.getElementsByTagName("video")[0];
		if (video) {
			video.setAttribute("style", "max-width:300px;");
		}
	}
	function trackRemoved(track) {
		track.detach().forEach( function(element) { element.remove() });
	}
	function leaveRoomIfJoined() {
		if (activeRoom) {
			activeRoom.disconnect();
		}
	}
});
```

That’s our video app, this can be used to host webinars pretty easily, or any other type of video chat where you want to use a one-to-many type situation.

### Hosting and attending a talk

Hosting a talk is pretty straight forward, you just open the URL with a slug for it:

```
http://localhost:3333/talk/host/slug
```

This will create a webinar with the slug of `slug`, any other hosts can use the same URL to be broadcast their video.

To attend a talk, you would just share the guest URL:

```
http://localhost:3333/talk/slug
```

Any visitors who use this URL would see all video hosts on the talk and can watch the broadcast while not sharing video.

## What’s next?

You’ve  gotten a nice intro to both AdonisJS and Twilio Video, and we’ve taken video chats a little unconventional with the host / guest mode.

This app can be extended pretty quickly to include user accounts, Q&A, or chat	 directly so that guests can interact with hosts.

You can find the sample code here on [GitHub](https://github.com/freekrai/groupinar). If you encounter errors while working through this post or with the finished source code, please leave a comment or open an issue on GitHub.

You can extend it and if you’d like to show me what extra functionality you added, got questions, or want to send a thank you tweet, you can reach me via email at roger@datamcfly.com
