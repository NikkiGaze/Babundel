const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");

var peer = new Peer({
	host: location.hostname,
	port: location.port || (location.protocol === 'https:' ? 443 : 80),
	path: '/peerjs'
//  host: '127.0.0.1',
//  port: 3030,
//  path: '/peerjs',
//  config: {
//    'iceServers': [
//      { url: 'stun:stun01.sipphone.com' },
//      { url: 'stun:stun.ekiga.net' },
//      { url: 'stun:stunserver.org' },
//      { url: 'stun:stun.softjoys.com' },
//      { url: 'stun:stun.voiparound.com' },
//      { url: 'stun:stun.voipbuster.com' },
//      { url: 'stun:stun.voipstunt.com' },
//      { url: 'stun:stun.voxgratia.org' },
//      { url: 'stun:stun.xten.com' },
//      {
//        url: 'turn:192.158.29.39:3478?transport=udp',
//        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//        username: '28224511:1379330808'
//      },
//      {
//        url: 'turn:192.158.29.39:3478?transport=tcp',
//        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
//        username: '28224511:1379330808'
//      }
//    ]
//  },

//  debug: 3
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

const drawCanvas = document.querySelector("#drawCanvas");
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

////////////////////////////////////////////////////////////////////////
function drawPixel(pixel) {
    var context = drawCanvas.getContext('2d');
    context.fillStyle = 'green';
    context.beginPath();
    context.arc(pixel.x, pixel.y, 3, 0, 2 * Math.PI);
    context.fill();
}

var mouseDown = false
var pixels = {};
var pixelNum = 0;
var touch_mouseDown = false
var touch_pixels = {};
var touch_pixelNum = 0;

var offsetX = drawCanvas.getBoundingClientRect().left;
var offsetY = drawCanvas.getBoundingClientRect().top;

socket.on("log", function(data) {
    console.log(data);
});

drawCanvas.addEventListener('mousedown', function(event) {
	mouseDown = true
	pixels[pixelNum] = {
		x : event.offsetX,
		y : event.offsetY};
	drawPixel(pixels[pixelNum]);
	pixelNum++;
});

drawCanvas.addEventListener('mousemove', function(event) {
	if (mouseDown == true){
		pixels[pixelNum] = {
		x : event.offsetX,
		y : event.offsetY};
//	drawLine(pixels[pixelNum - 1], pixels[pixelNum]);
	drawPixel(pixels[pixelNum]);
	pixelNum++;
	};
});

drawCanvas.addEventListener('mouseup', function(event) {
	mouseDown = false
	pixelNum = 0;
	//socket.emit("join-room", ROOM_ID, id, user);
	socket.emit("pixels", pixels);
	pixels = {};
});

drawCanvas.addEventListener('touchstart', function(event) {
	touch_mouseDown = true
	console.log("touchstart");
	const touches = event.changedTouches;
	touch_pixels[touch_pixelNum] = {
		x : touches[0].pageX - offsetX,
		y : touches[0].pageY - offsetY};
	drawPixel(touch_pixels[touch_pixelNum]);
	touch_pixelNum++;
});

drawCanvas.addEventListener('touchmove', function(event) {
	if (touch_mouseDown == true){
	    const touches = event.changedTouches;
		touch_pixels[touch_pixelNum] = {
		x : touches[0].pageX - offsetX,
		y : touches[0].pageY - offsetY};
//	drawLine(pixels[pixelNum - 1], pixels[pixelNum]);
	    drawPixel(touch_pixels[touch_pixelNum]);
	    touch_pixelNum++;
	};
});

drawCanvas.addEventListener('touchend', function(event) {
	touch_mouseDown = false
	touch_pixelNum = 0;
	//socket.emit("join-room", ROOM_ID, id, user);
	socket.emit("pixels", touch_pixels);
	touch_pixels = {};
});

////////////////////////////////////////////////////////////////////////

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});

socket.on("drawSegment", function(pixels) {
  //console.log("drawSegment");
  for (var id in pixels) {
	drawPixel(pixels[id]);
  }
});
