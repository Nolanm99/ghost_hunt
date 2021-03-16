const socket = io();
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox');

socket.on('chat message', msg=> {
    li = document.createElement('li');
    li.appendChild(document.createTextNode(msg));
    chatBox.appendChild(li);
})

chatForm.addEventListener('submit', function(e){
    e.preventDefault();
    if (chatInput.value) {
        socket.emit('chat message', chatInput.value);
        chatInput.value = '';
    }
})
