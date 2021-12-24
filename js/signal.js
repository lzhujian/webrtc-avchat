'use strict';

var isInitiator;    // 是否房间创建者

window.room = prompt('Enter room name:');

var socket = io.connect();

// 请求进入房间
if (room !== '') {
    trace('Asking enter room: ' + room);
    socket.emit('enter', room);
}

// socket消息处理
socket.on('created', function (room, clientId) {
    trace('Peer: ' + clientId + ' reated room: ' + room);
    isInitiator = true;
});

socket.on('join', function (room, clientId) {
    trace('Another peer:' + clientId + ' joined in room:' + room);
});

socket.on('joined', function (room, clientId) {
    trace('Peer: ' + clientId + ' joined in room: ' + room);
    isInitiator = false;
});

socket.on('full', function (room) {
    trace('Room:' + room + ' is full');
});

socket.on('message', function (message) {
    trace('Receive message: ' + message);
});

// 日志输出
function trace(message) {
    console.log(message);
    var signalLog = document.getElementById("signalLogList");
    signalLog.innerHTML += '<li>' + message + '</li>';
}