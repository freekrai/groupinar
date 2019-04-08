if( typeof talk === "undefined" ) alert("please set your talk object");
let $chatWindow = $('#messages');
let chatChannel;
let chatClient;
let username;
let accessToken;
let activeRoom;
let previewTracks;
let roomName = talk.slug;

window.addEventListener('beforeunload', leaveRoomIfJoined);

fetch('/talk/token')
.then(resp => resp.json())
.then(data => {
	accessToken = data.token;
	username = data.identity;

// chat...
//		chatClient = new Twilio.Chat.Client(accessToken);
//		chatClient.getSubscribedChannels().then(createOrJoinChannel);

//	video....
	let videoOptions = {
		name: talk.slug,
		audio: false,
		video: false
	};
	if( talk.host == "on" ){
		videoOptions = {
			audio: true,
			video: { width: 300 }
		};
	}
	return Twilio.Video.createLocalTracks(videoOptions);
}).then( localTracks => {
	return Twilio.Video.connect(accessToken, {
		name: talk.slug,
		tracks: localTracks,
		video: { width: 300 }
	});
}).then( room => {
	activeRoom = room;
	console.log('Successfully joined a Room: ', room.name);
	room.participants.forEach(participantConnected);
	let previewContainer = document.getElementById(room.localParticipant.sid);
	if (!previewContainer || !previewContainer.querySelector('video')) {
		participantConnected(room.localParticipant);
	}
	room.on('participantConnected', participant => {
		console.log("Joining: '" + participant.identity + "'");
		participantConnected(participant);
	});
	room.on('participantDisconnected', participant => {
		console.log("Disconnected: '" + participant.identity + "'");
		participantDisconnected(participant);
	});
}).catch(err => {
	console.log(err);
});

// chat code...
function print(infoMessage, asHtml) {
		var $msg = $('<div class="info">');
		if (asHtml) {
			$msg.html(infoMessage);
		} else {
			$msg.text(infoMessage);
		}
		$chatWindow.append($msg);
	}

	function printMessage(fromUser, message) {
		var $user = $('<span class="username">').text(fromUser + ':');
		if (fromUser === username) {
			$user.addClass('me');
		}
		var $message = $('<span class="message">').text(message);
		var $container = $('<div class="message-container">');
		$container.append($user).append($message);
		$chatWindow.append($container);
		$chatWindow.scrollTop($chatWindow[0].scrollHeight);
	}

	function createOrJoinChannel() {
		print('Attempting to join "' + talk.slug + '" chat channel...');
		var promise = chatClient.getChannelByUniqueName(talk.slug);
		promise.then(function(channel) {
			chatChannel = channel;
			console.log('Found ' + talk.slug + ' channel:');
			console.log(chatChannel);
			setupChannel();
		}).catch(function() {
			// If it doesn't exist, let's create it
			console.log('Creating ' + talk.slug + ' channel');
			chatClient.createChannel({
				uniqueName: talk.slug,
				friendlyName: 'General ' + talk.slug + ' Channel'
			}).then(function(channel) {
				console.log('Created ' + talk.slug + ' channel:');
				console.log(channel);
				chatChannel = channel;
				setupChannel();
			});
		});
	}

	// Set up channel after it has been found
	function setupChannel() {
		// Join the general channel
		chatChannel.join().then(function(channel) {
			print('Joined channel as '+ '<span class="me">' + username + '</span>.', true);
		});
		// Get Messages for a previously created channel
		chatChannel.getMessages().then(function(messages) {
			const totalMessages = messages.items.length;
			for (i = 0; i < totalMessages; i++) {
				const message = messages.items[i];
				printMessage(message.author, message.body);
			}
		});
		// Listen for new messages sent to the channel
		chatChannel.on('messageAdded', function(message) {
			printMessage(message.author, message.body);
		});
	}

	// Send a new message to the general channel
	var $input = $('#chat-input');
	$input.on('keydown', function(e) {
		if (e.keyCode == 13) {
			chatChannel.sendMessage($input.val())
			$input.val('');
		}
	});
//	video code...
function participantConnected(participant) {
	console.log('Participant "%s" connected', participant.identity);
	const div = document.createElement('div');
	div.id = "video-"+participant.sid;
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
	console.log('Participant "%s" disconnected', participant.identity);
	participant.tracks.forEach(trackRemoved);
	document.getElementById("video-"+participant.sid).remove();
	document.getElementById(participant.sid).remove();
}
function trackAdded(div, track) {
	div.appendChild(track.attach());
	let video = div.getElementsByTagName("video")[0];
	if (video) {
		video.setAttribute("class", "videobox");
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
