const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
// socket.io expect it to be called with the raw http server
const io = socketio(server);

const port = process.env.port || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

let count = 0;
// const welcome = 'Welcome to Chat App!'

// listening event occur
// params: name of event, and function that run when event occur

// "connection" event: it is going to fire whenever socketio server get a new connection
// 'socket': an object, contains information about that new connection
io.on('connection', (socket) => {
    console.log('new websocket connection');

    // param: name event, emit an event from server to client
    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++;
    //     // socket.emit('countUpdated', count);
    //     // emit to all connections
    //     io.emit('countUpdated', count);


    // });



    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        }

        // allow us to join a given chat room, and we pass to it the name of the room we are trying to join
        socket.join(user.room);

        // challenge
        socket.emit('displayMessage', generateMessage('Admin', 'Welcome!'));

        // only send message to another users, not current user
        socket.broadcast.to(user.room).emit('displayMessage', generateMessage('Admin', `${user.username} has joined!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // let client know they were able to join   
        callback();

        // socket.emit: send to current connection
        // io.emit: send to all connections
        // socket.broadcast.emit: send to other connection, except
        // io.to.emit: only send to every connections in a specific room
        // socket.broadcast.to.emit: similar socket.broadcast.emit, but in a specific room
    });

    socket.on('chatMessage', (message, callback) => {

        const user = getUser(socket.id);
        if (!user) {
            return callback('Can\'t find current user');
        }
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('displayMessage', generateMessage(user.username, message));
        callback();
    });
    // ** server (emit) => client (receive) => countUpdated
    // ** client (emit) => server (receive) => increment

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        if (!user) {
            return callback({ error: 'something wrong, can\'t get a current user' })
        }
        io.to(user.room).emit('locationSharing', generateLocationMessage(user.username, `https://google.com/maps?q=${location.longitude},${location.latitude}`));
        callback({ message: 'Location shared!' });
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('displayMessage', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    });
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
})

// websocket protocol
// using for creating realtime applications
// when we start the server, other clients can connect it

//** full-duplex communication */
// client can initiate  communication with the server. and server can initiate communication with the client
// websocket is as separate protocol from http
// persistent connection between client and server