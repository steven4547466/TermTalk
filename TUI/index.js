const socket = require('socket.io-client')('http://localhost:3000');
const Login = require("./src/Login")

socket.on('connect', () => {
	Login.run(socket)
})
