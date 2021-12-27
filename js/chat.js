'use strict';

var isInitiator = false;    // 是否房间创建者
var isChannelReady = false; // 对方peer是否进入房间
var isStarted = false; // 是否

// 视频流
let localStream;
let remoteStream;

// RTCPeerConnection
var pc;

// 媒体流约束，本例只开启视频
const mediaStreamConstraints = {
    audio: false,
    video: true,
    video: {
        width: { exact: 480 },
        height: { exact: 320 }
    }
};

// video元素用于保存视频流
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

window.room = prompt('Enter room name:');

var socket = io.connect();

// 请求进入房间
if (room !== '') {
    trace('Asking enter room: ' + room);
    socket.emit('enter', room);

    startAction();
}

window.onbeforeunload = function () {
    sendMessage('bye');
};

// socket消息处理
socket.on('created', function (room, clientId) {
    trace('Peer: ' + clientId + ' reated room: ' + room);
    isInitiator = true;
});

socket.on('join', function (room, clientId) {
    trace('Another peer:' + clientId + ' joined in room:' + room + ', call');
    isChannelReady = true;
});

socket.on('joined', function (room, clientId) {
    trace('Peer: ' + clientId + ' joined in room: ' + room);
    isChannelReady = true;
});

socket.on('full', function (room) {
    trace('Room:' + room + ' is full');
});

socket.on('message', function (message) {
    console.log('Received message:', message);
    if (message == 'gotMediaStream') {
        startChat();
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    } else {
        if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
                startChat();
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            createAnswer();
        } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        }
        trace('Received message:' + message.type)
    }
});

// 发送消息到server
function sendMessage(message) {
    console.log('Sending message: ', message);
    socket.emit('message', room, message);
}

// 日志输出
function trace(message) {
    console.log(message);
    var signalLog = document.getElementById("signalLogList");
    signalLog.innerHTML += '<li>' + message + '</li>';
}

// 获取本地流
function startAction() {
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    trace("Requesting local stream.")
}

// getUserMedia获取视频流成功处理函数，添加MediaStream到video标签
function gotLocalMediaStream(mediaStream) {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
    trace('Received local stream, isInitiator:' + isInitiator + ', isChannelReady:' + isChannelReady);
    sendMessage('gotMediaStream');
    if (isInitiator && isChannelReady) {
        // 开启视频通话
        startChat();
    }
}

// 传输视频流，双方peer加入房间，获取到流后由一端发起call
function callAction() {
    // only video
    const offerOptions = {
        offerToReceiveVideo: 1,
    };
    pc.createOffer(offerOptions).then(setLocalAndSendSdp)
        .catch(setSessionDescriptionError);
}

function hangupAction() {
    pc.close();
    pc = null;
    isStarted = false;

    trace("Ending call....");
}

// 错误处理函数，将错误信息log到console
function handleLocalMediaStreamError(error) {
    trace('navigator.getUserMedia error: ' + error);
}

// 试图开启视频通话
function startChat() {
    console.log('startChat: ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            callAction();
        }
    }
}

// create RTCPeerConnection and setup listener
function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.addEventListener('icecandidate', handleConnection);
        pc.addEventListener('addstream', gotRemoteMediaStream);
        pc.addEventListener('removestream', removedRemoteMediaStream);
        trace('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

// icecandidate
function handleConnection(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
        trace('Sending candidate');
    } else {
        console.log('End of candidates.');
    }
}

// addstream
function gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace("Received remote stream.");
}

// removestream
function removedRemoteMediaStream(event) {
    console.log('Remote stream removed. Event: ', event);
}

// 获取sdp，设置session description
function setLocalAndSendSdp(description) {
    pc.setLocalDescription(description);

    // 将 description 发送到对端
    sendMessage(description);
    trace('Sending description');
}

// 接收端create answer
function createAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(setLocalAndSendSdp)
        .catch(setSessionDescriptionError);
}

function setSessionDescriptionError(error) {
    trace(`Failed to set session description ${error.toString()}.`);
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    hangupAction();
    isInitiator = false;
}