const socket = require('socket.io-client')('http://localhost:3000');
const rl = require("readline")
const { Select, prompt } = require('enquirer')

let authed;
let user;

socket.on('connect', async () => {
	console.log(`Connected to the server.`)
	let res = {}
	const promptt = new Select(
	  {
	    name: "checkpoint",
	    message: "What would you like to do?",
	    choices: ["Register", "Login"]
	  })
	promptt.run().then(async res => {
		if(res === "Register") {
		_register()
	} else {
		_login()
	}
	})
	socket.on("auth_result", (data) => {
		if(!data.success) {
			console.log("\u001b[31;1m" + data.message + "\u001b[0m")
			if(data.method === "login") {
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
})

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

socket.on('msg', (d) => {
	if(d.username == user.username) return
	console.log(`\u001b[1A\u001b[${process.stdout.columns}D\u001b[2K${d.username} > ${d.msg}`)
	_awaitMessage()
})

async function _awaitMessage(){
	try{
		let message = await prompt({type:"input",name:"message",message:"=>"})
		socket.emit("msg", {msg:message.message,username:user.username,tag:user.tag})
		_awaitMessage()
	}catch(e){
		console.error(e)
		process.exit()
	}
}

socket.on('disconnect', function() {
	socket.emit('disconnect')
})
