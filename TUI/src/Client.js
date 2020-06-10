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

const blessed = require("blessed")
const contrib = require("blessed-contrib")

class ClientTUI {

	static textPrefix = ""
	static textSuffix = ""

	static run(socket, user) {
		const screen = blessed.screen({
			smartCSR: true,
			title: "TermTalk Client"
		})

		const form = blessed.form({
			parent: screen,
			width: "100%",
			left: "center",
			keys: true,
			vi: true
		})

		const grid = new contrib.grid({rows: 8, cols: 8, screen: screen})

		const messages = grid.set(0, 0, 7.5, 7, contrib.log, {
			fg: "blue",
			selectedFg: "blue",
			label: "Messages",
			tags:true
		})

		const messageBox = blessed.textarea({
			parent: form,
			name: "msg",
			top: "94%",
			height: 3,
			inputOnFocus: true,
			content: "first",
			border: {
				type: "line"
			}
		})

		messageBox.key("enter", () => form.submit())

		form.on("submit", () => {
			const msg = sanitize(messageBox.getValue())
			messageBox.clearValue()
			if(ClientTUI.handleCommands(msg.trim(), messages)) return
			socket.emit("msg", {msg, username: user.username, tag: user.tag, uid: user.uid, sessionID: user.sessionID })
			messages.log(`${ClientTUI.textPrefix}${user.username}#${user.tag} > ${msg}${ClientTUI.textSuffix}`)
		})

		socket.on('msg', (data) => {
			if(data.uid == user.uid) return
			messages.log(`${ClientTUI.textPrefix}${data.username}#${data.tag} > ${data.msg}${ClientTUI.textSuffix}`)
		})

		socket.on("disconnect", () => {
			messages.log(`{red-fg}Client > You have been disconnected.{/red-fg}`)
		})

		socket.on("reconnect", () => {
			messages.log(`{red-fg}Client > Reconnected.{/red-fg}`)
		})

		socket.on("reconnect_attempt", () => {
			messages.log(`{red-fg}Client > Attempting reconnect.{/red-fg}`)
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}

	static handleCommands(message, messages){
		if(!message.startsWith("/")) return false
		let colorRegex = /(#(\d|[a-f]){6})-text/i
		let matches
		if(matches = colorRegex.exec(message)){ 
			ClientTUI.textPrefix = `{${matches[1]}-fg}`
			ClientTUI.textSuffix = `{/${matches[1]}-fg}`
			messages.log(`${ClientTUI.textPrefix}Messages now of color ${matches[1]}.${ClientTUI.textSuffix}`)
			return true
		}
		return false
	}
}

function sanitize(text){
	return text.replace(/\{/g, "{ ")
}

module.exports = ClientTUI;
