// you will be streaming only video (video: true).
const DISPLAY_MEDIA_CONSTRAINTS = {
  video1: {
    cursor: 'always',
  },
  audio: false,
};
// Video element where stream will be placed.
const videoElem = document.querySelector('video1');
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
}

startButton.onclick = startAction;
stopButton.onclick = stopAction;
