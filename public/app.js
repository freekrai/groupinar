$(function() {
	var $chatWindow = $('#messages');
	var chatChannel;
	var chatClient;
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

	print('Logging in...');
	//	generate token..
	$.getJSON('/webinar/token', {
		device: 'browser'
	}, function(data) {
		accessToken = data.token;
		username = data.identity;

		chatClient = new Twilio.Chat.Client(accessToken);
		chatClient.getSubscribedChannels().then(createOrJoinChannel);

		var video_options = {
			audo: false,
			video: false
		};

		if( talk.host ){
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
			console.log('Successfully joined a Room: ', room.name);
			room.participants.forEach(participantConnected);
			var previewContainer = document.getElementById(room.localParticipant.sid);
			if (!previewContainer || !previewContainer.querySelector('video')) {
				participantConnected(room.localParticipant);
			}
			room.on('participantConnected', function(participant) {
				console.log("Joining: '" + participant.identity + "'");
				participantConnected(participant);
			});
			room.on('participantDisconnected', function(participant) {
				console.log("Disconnected: '" + participant.identity + "'");
				participantDisconnected(participant);
			});
		});
	});
	// Helper function to print info messages to the chat window
	function print(infoMessage, asHtml) {
		var $msg = $('<div class="info">');
		if (asHtml) {
			$msg.html(infoMessage);
		} else {
			$msg.text(infoMessage);
		}
		$chatWindow.append($msg);
	}

	// Helper function to print chat message to the chat window
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
	function participantConnected(participant) {
		console.log('Participant "%s" connected', participant.identity);
		const div = document.createElement('div');
		div.id = participant.sid+"-video";
		div.setAttribute("style", "float: left; margin: 10px;");
		const div2 = document.createElement('div');

		div2.id = participant.sid;
		div2.setAttribute("style", "float: left; margin: 10px;");
		div2.innerHTML = "<div style='clear:both'>"+participant.identity+"</div>";

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