if( typeof talk === "undefined" ) alert("please set your talk object");
let username;
let accessToken;
let activeRoom;
let previewTracks;
let roomName = talk.slug;

// Check for WebRTC
if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
	alert('WebRTC is not available in your browser.');
}

window.addEventListener('beforeunload', leaveRoomIfJoined);

fetch('/talk/token')
.then(resp => resp.json())
.then(data => {
	accessToken = data.token;
	username = data.identity;

	let video_options = {
		name: talk.slug,
		audio: false,
		video: false
	};
	if( talk.host == "on" ){
		video_options = {
			audio: true,
			video: { width: 300 }
		};
	}
	return Twilio.Video.createLocalTracks(video_options);
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
