// Generate random room name if needed
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const roomHash = location.hash.substring(1);

// TODO: Replace with your own channel ID
const drone = new ScaleDrone('8rOcta9v4zs5FvWm');
// Room name needs to be prefixed with 'observable-'
const roomName = 'observable-' + roomHash;
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};
let room;
let pc;


function onSuccess() {};
function onError(error) {
  console.error(error);
};

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  room = drone.subscribe(roomName);
  room.on('open', error => {
    if (error) {
      onError(error);
    }
  });
  // We're connected to the room and received an array of 'members'
  // connected to the room (including us). Signaling server is ready.
  room.on('members', members => {
    console.log('MEMBERS', members);
    // If we are the second user to connect to the room we will be creating the offer
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });
});

// Send signaling data via Scaledrone
function sendMessage(message) {
  drone.publish({
    room: roomName,
    message
  });
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  // If user is offerer let the 'negotiationneeded' event create the offer
  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer().then(localDescCreated).catch(onError);
    }
  }

  // When a remote stream arrives display it in the #remoteVideo element
  pc.onaddstream = event => {
    remoteVideo.srcObject = event.stream;
  };

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then(stream => {
    // Display your local video in #localVideo element
    localVideo.srcObject = stream;
    // Add your stream to be sent to the conneting peer
    pc.addStream(stream);
  }, onError);

  // Listen to signaling data from Scaledrone
  room.on('data', (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // When receiving an offer lets answer it
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}
// you will be streaming only video (video: true).
const DISPLAY_MEDIA_CONSTRAINTS = {
  video: {
    cursor: 'always',
  },
  audio: false,
};
// Video element where stream will be placed.
const videoElem = document.querySelector('video');
const videoStat = document.querySelector('#video-stat');
//buttons
var startButton = document.querySelector('button#startButton');
var stopButton = document.querySelector('button#stopButton');

//log
const logElem = document.getElementById('log');

console.log = (msg) => (logElem.innerHTML += `${msg}<br>`);
console.error = (msg) =>
  (logElem.innerHTML += `<span class="error">${msg}</span><br>`);
console.warn = (msg) =>
  (logElem.innerHTML += `<span class="warn">${msg}<span><br>`);
console.info = (msg) =>
  (logElem.innerHTML += `<span class="info">${msg}</span><br>`);

// Local stream that will be reproduced on the video.
let localStream;

//timeInterval for display stat
let interval;

// Sets the MediaStream as the video element src.
function gotMediaStream(mediaStream) {
  videoElem.srcObject = mediaStream;
  localStream = mediaStream;
  dumpOptionsInfo();
  displayStat();
  logElem.style.display = 'inline-block';
}

// Handles error by logging a message to the console.
function handleMediaStreamError(error) {
  console.error(`navigator.getUserMedia error: ${error.toString()}.`);
}

// Handles start button action: creates local MediaStream.
function startAction() {
  navigator.mediaDevices
    .getDisplayMedia(DISPLAY_MEDIA_CONSTRAINTS)
    .then(gotMediaStream)
    .catch(handleMediaStreamError);
  startButton.disabled = true;
  stopButton.disabled = false;
}

function stopAction() {
  let tracks = videoElem.srcObject.getTracks();
  tracks.forEach((track) => track.stop());
  videoElem.srcObject = null;
  startButton.disabled = false;
  stopButton.disabled = true;
  logElem.innerHTML = '';
  logElem.style.display = 'none';
  stopDisplayStat();
}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
  console.info('Track settings:');
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info('Track constraints:');
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

// Display statistics
function displayStat() {
  interval = setInterval(() => {
    if (videoElem.videoWidth) {
      const width = videoElem.videoWidth;
      const height = videoElem.videoHeight;
      videoStat.innerHTML = `<strong>Video dimensions:</strong> ${width}x${height}px`;
    }
  }, 3000);
}

function stopDisplayStat() {
  clearInterval(interval);
  videoStat.innerHTML = ``;
}

startButton.onclick = startAction;
stopButton.onclick = stopAction;
