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

## 使用RTCPeerConnection传输视频流

WebRTC节点之间建立连接只需要完成如下三步：

1. 创建RTCPeerConnection，并添加getUserMedia获取的流

2. 获取并分享网络信息: 连接端点被称为ICE candidate

3. 获取并分享本地和远端的描述信息: SDP格式的本地媒体的元数据

![webrtc-offer-answer-model.png](https://github.com/lzhujian/webrtc-avchat/blob/master/images/webrtc-offer-answer-model.png)

## 使用RTCDataChannel传输数据

RTCDataChannel用于webrtc peer之间传输任意数据。Webrtc使用`RTCPeerConnection`的`createDataChannel()`来创建data channel, 对端peer将收到`RTCDataChannelEvent`消息，表示DataChannel已添加到PeerConnection连接。

```javascript
var pc = new RTCPeerConnection();
var dc = pc.createDataChannel("my channel");

dc.onmessage = function (event) {
  console.log("received: " + event.data);
};

dc.onopen = function () {
  console.log("datachannel open");
};

dc.onclose = function () {
  console.log("datachannel close");
};
```