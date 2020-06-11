/*
	TermTalk - A simple and straightforward way of talking to your peers in the terminal.
	Copyright (C) 2020 Terminalfreaks

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const io = require("socket.io-client")
const blessed = require("blessed")
const Login = require("./src/Login")

const screen = blessed.screen({
	smartCSR: true,
	title: "TermTalk"
})
	
const form = blessed.form({
	parent: screen,
	width: "100%",
	left: "center",
	keys: true,
	vi: true
})

const error = blessed.box({
	parent: screen,
	left: "center",
	top: 14,
	width: "50%",
	height: "10%",
	content: " ",
	tags: true,
	hidden: true,
	border: {
		type: "line"
	},
	style: {
		fg: "red",
		border: {
			fg: "red"
		}
	}
})
// Textbox Labels
const usernameLabel = blessed.text({
	parent: screen,
	top: 4,
	left: "center",
	content: "IP to connect to (with port): "
})
const ip = blessed.textarea({
	parent: form,
	name: "ip",
	top: 5,
	left: "center",
	height: 3,
	width: "40%",
	inputOnFocus: true,
	content: "first",
	border: {
		type: "line"
	}
})
const connect = blessed.button({
	parent: form,
	name: "connect",
	content: "Connect",
	top: 8,
	left: "center",
	shrink: true,
	padding: {
		top: 1,
		bottom: 1,
		left: 2,
		right: 2,
	},
	style: {
		bold: true,
		fg: "white",
		bg: "blue",
		focus: {
			inverse: true
		}
	}
})

connect.on("press", () => form.submit())

form.on("submit", (data) => {
	if(!data.ip) {
		error.content = "{center}Please enter the IP and port to connect to.{/center}"
		if(error.hidden) { 
			error.toggle()
		}
		screen.render()
	} else {
		socket = io(data.ip.startsWith("http") ? data.ip : `http://${data.ip}`)
		screen.destroy()
		run()
	}
})

screen.key(["q", "C-c"], () => {
	process.exit();
})

screen.render()

function run() {
	socket.on('connect', () => {
		socket.removeAllListeners()
		Login.run(socket)
	})
}
