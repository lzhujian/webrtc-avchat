'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new nodeStatic.Server();
var app = http.createServer(function (req, res) {
    fileServer.serve(req, res);
}).listen(8001);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {

    // peer进入房间
    socket.on('enter', function (room) {
        console.log('Peer enter room: ', room);

        // 房间里peer用户数
        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room, socket.id);    // 响应创建房间'created'消息
            console.log('Create room: ', room);
        } else if (numClients == 1) {
            io.sockets.in(room).emit('join', room, socket.id); // 向房间其他用户响应'join'消息
            socket.emit('joined', room, socket.id); // 返回'joined'消息
            socket.join(room);
            console.log('Peer ', socket.id, ' joined in room: ', room);
        } else {    // 房间最多2个用户
            socket.emit('full', room);
            console.log('Maximum 2 users are permitted');
        }
    });

    socket.on('message', function (room, message) {
        console.log('Receive message: ', message);
        socket.broadcast.to(room).emit('message', message);
    });

    socket.on('bye', function () {
        console.log('Received bye');
    })
});

