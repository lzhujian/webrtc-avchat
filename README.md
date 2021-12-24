# webrtc-avchat

使用WebRTC实现一对一实时通信

## WebRTC简介

Web实时通信（WebRTC）包含一系列协议、标准和JavaScript API，WebRTC能使浏览器之间进行音频、视频和数据共享，而不需要依赖第三方插件，WebRTC通过简单JavaScript API就能使web应用实现实时通信。主要有如下三个API：

* MediaStream: 获取音频和视频流

* RTCPeerConnection: 音频和视频数据通信

* RTCDataChannel: 应用数据通信

## 从webcam获取视频流

```javascript
const mediaStreamConstraints = {
    audio: false,
    video: true
};

navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(function (mediaStream) {
        document.querySelector('video').srcObject = mediaStream;
    });
```
