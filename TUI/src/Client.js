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
			label: "Messages"
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
			const msg = messageBox.getValue()
			messageBox.clearValue()
			socket.emit("msg", {msg, username: user.username, tag: user.tag, sessionID: user.sessionID })
			messages.log(`${user.username}#${user.tag} > ${msg}`)
		})

		socket.on('msg', (data) => {
			if(data.sessionID == user.sessionID) return
			messages.log(`${data.username}#${data.tag} > ${data.msg}`)
		})
		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}
}

module.exports = ClientTUI;
