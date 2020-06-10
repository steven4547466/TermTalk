const socket = require('socket.io-client')('http://localhost:3000');
const rl = require("readline")
const { Select, prompt } = require('enquirer')
let user;

socket.on('connect', async () => {
	console.log(`Connected to the server.`)
	try {
		const ans = await prompt({
			type: "select",
			name: "checkpoint",
			message: "What would you like to do?",
			choices: ["Register", "Login"]
		})

		if (ans.checkpoint === "Register") {
			_register()
		} else {
			_login()
		}
	} catch(err) {
		console.error(err)
		process.exit(1)
	}

	socket.on("auth_result", (data) => {
		if (!data.success) {
			console.log("\u001b[31;1m" + data.message + "\u001b[0m")
			if (data.method === "login") {
				_login()
			} else {
				_register()
			}
		} else {
			console.log("\u001b[32m" + data.message + "\u001b[0m")
			user = data.user
			_awaitMessage()
		}
	})
	
	socket.on("method_result", (data) => {
		if(!data.success){
			console.log("\u001b[31;1m" + data.message + "\u001b[0m")
		}
	})
})

socket.on('msg', (data) => {
	console.log(`\u001b[1A\u001b[${process.stdout.columns}D\u001b[2K\n${data.username} > ${data.msg}`)
	_logPromptPrefix()
})

async function _awaitMessage() {
	try {
		let { msg } = await prompt({ type: "input", name: "msg", message: `\u001b[${process.stdout.columns}D\u001b ` })
		socket.emit("msg", {msg, username: user.username, tag: user.tag, sessionID: user.sessionID })
		_awaitMessage()
	} catch (e) {
		console.error(e)
		process.exit(0)
	}
}

/*
	TODO: Change this to some kind of socket.disconnect() on CTRL-C
	That is the only way we can disconnect properly.

socket.on('disconnecting', function () {
	socket.emit('disconnect', {sessionID:user.sessionID})
})
*/

async function _login() {
	const login = await prompt([
		{
			type: "input",
			name: "uid",
			message: "UID (Account Name)?"
		},
		{
			type: "password",
			name: "password",
			message: "Password?"
		}
	])
	socket.emit("login", login)
}
async function _register() {
	const reg = await prompt([
		{
			type: "input",
			name: "uid",
			message: "What do you want your Account Name (UID) to be? (This is used to login.)"
		},
		{
			type: "input",
			name: "username",
			message: "Username?"
		},
		{
			type: "input",
			name: "tag",
			message: "Tag? (This will appear after your name. 4 characters.)"
		},
		{
			type: "password",
			name: "password",
			message: "Password?"
		}
	])
	socket.emit("register", reg)
}

function _logPromptPrefix(){
	console.log(` »`)
}
