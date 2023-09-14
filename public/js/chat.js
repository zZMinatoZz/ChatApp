const socket = io();

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked');
//     socket.emit('increment');
// })

// challenge
// socket.on('welcome', (welcome) => {
//     console.log(welcome);
// });

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// message template
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const locationMessage = 'My location';

// ignoreQueryPrefix: remove ""
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // get all style stats of this element (width, height, margin...)
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    // height of the message
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    // how far have I scrolled?
    scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable

    $messageFormButton.setAttribute('disabled', 'disabled');


    const message = e.target.elements.message.value;
    // 3rd param: acknowledgement
    socket.emit('chatMessage', message, (error) => {

        // enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }

        console.log('Message was delivered!');
    });
});

socket.on('displayMessage', (message) => {
    // console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationSharing', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        locationMessage,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { longitude: position.coords.longitude, latitude: position.coords.latitude }, ({ error, message }) => {
            $sendLocationButton.removeAttribute('disabled');
            if (error) {
                return alert(error);
            }
            console.log(message);
        });
    });
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        // return home page
        location.href = '/';
    }
});