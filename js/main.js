'use strict';

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

// 视频流
let localStream;
let remoteStream;

// RTCPeerConnection
let localPeerConnection;
let remotePeerConnection;

const startButton = document.getElementById("startButton");
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

// 日志输出函数
function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
    console.log(now, text);
}

// getUserMedia获取视频流成功处理函数，添加MediaStream到video标签
function gotLocalMediaStream(mediaStream) {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
    trace("Received local stream.");
    callButton.disabled = false;
}

function gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace("Received remote stream.");
}

// 错误处理函数，将错误信息log到console
function handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

// Start按钮操作，创建本地流
function startAction() {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    trace("Requesting local stream.")
}

// 返回对端peer connection
function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        remotePeerConnection : localPeerConnection;
}

// 与对端candidate建立连接，RTCPeerIceCandidateEvent
function handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    // 将 ice candidate 添加到对端
    if (iceCandidate) {
        const newIce = new RTCIceCandidate(iceCandidate);
        const otherPeer = getOtherPeer(peerConnection);
        otherPeer.addIceCandidate(newIce)
    }
}

function createdAnswer(description) {
    trace(`Answer from remotePeerConnection: ${description.sdp}`);

    localPeerConnection.setRemoteDescription(description);

    remotePeerConnection.setLocalDescription(description);
}

// 获取sdp，设置session description
function createdOffer(description) {
    trace(`Offer from localPeerConnection: ${description.sdp}`);

    localPeerConnection.setLocalDescription(description);

    // 实际场景 将 description 发送到对端
    remotePeerConnection.setRemoteDescription(description);

    // create answer
    remotePeerConnection.createAnswer().then(createdAnswer)
        .catch(setSessionDescriptionError);
}

function setSessionDescriptionError(error) {
    trace(`Failed to set session description ${error.toString()}.`);
}

// Call按钮事件，传输视频流
function callAction() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    trace("Starting call.");

    // 获取媒体流track
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
        trace(`Using video device: ${videoTracks[0].label}.`);
    }

    const servers = null;
    localPeerConnection = new RTCPeerConnection(servers);
    localPeerConnection.addEventListener('icecandidate', handleConnection);

    remotePeerConnection = new RTCPeerConnection(servers);
    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    // 监听 addstream 事件
    remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

    localPeerConnection.addStream(localStream);

    // only video
    const offerOptions = {
        offerToReceiveVideo: 1,
    };
    localPeerConnection.createOffer(offerOptions).then(createdOffer)
        .catch(setSessionDescriptionError);
}

function hangupAction() {
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;

    hangupButton.disabled = true;
    callButton.disabled = false;

    trace("Ending call....");
}

// 添加按钮响应事件
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

// 按钮初始化状态
callButton.disabled = true;
hangupButton.disabled = true;