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
const io = require("socket.io-client")
const Login = require("./Login")
const Utils = require("../../src/Utils")

class ClientTUI {

	static textPrefix = `{${Utils.config.chatColor}-fg}`
	static textSuffix = `{/${Utils.config.chatColor}-fg}`
	static memberList = []

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

		const grid = new contrib.grid({ rows: 8, cols: 10, screen: screen })

		const messages = grid.set(0, 0, 7.5, 8, contrib.log, {
			label: "Messages",
			tags: true,
			style: {
				fg: "green",
				border: {
					fg: "cyan"
				}
			},
			screen: screen
		})
		const members = grid.set(0, 8, 7.5, 2, contrib.log, {
			label: "Members",
			tags: true,
			style: {
				fg: "green",
				border: {
					fg: "cyan"
				}
			}
		})

		let messageBox = blessed.textarea({
			parent: form,
			name: "msg",
			top: "94%",
			height: 3,
			inputOnFocus: true,
			content: "first",
			border: {
				type: "line"
			},
			style: {
				fg: Utils.config.chatColor,
				border: {
					fg: "cyan"
				}
			}
		})

		socket.emit("method", {
			type: "clientRequest",
			method: "getMemberList",
			...user
		})

		messageBox.key("enter", () => form.submit())

		form.on("submit", () => {
			const msg = sanitize(messageBox.getValue())
			messageBox.clearValue()
			if (this._handleCommands(msg.trim(), messages, screen, messageBox)) return
			socket.emit("msg", { msg, username: user.username, tag: user.tag, uid: user.uid, sessionID: user.sessionID })
			messages.log(`${user.username}#${user.tag} > ${msg.trim()}`, this.textPrefix, this.textSuffix)
		})

		socket.on('msg', (data) => {
			if (data.uid == user.uid) return
			if (data.server) return messages.log(`{white-fg}${data.username}#${data.tag} > ${data.msg}{/white-fg}`, "{white-fg}", "{/white-fg}")
			messages.log(`${data.username}#${data.tag} > ${data.msg}`, this.textPrefix, this.textSuffix)
		})

		socket.on("disconnect", () => {
			messages.log(`Client > You have been disconnected.`, "{red-fg}", "{/red-fg}")
		})

		socket.on("reconnect", (attempt) => {
			messages.log(`Client > Reconnected after ${attempt} attempt(s).`, "{red-fg}", "{/red-fg}")
			socket.emit("method", {
				type: "clientRequest",
				method: "reconnected",
				...user
			})
		})

		socket.on("reconnect_attempt", (attempt) => {
			messages.log(`Client > Attempting reconnect. #${attempt}`, "{red-fg}", "{/red-fg}")
		})

		socket.on("getUserData", () => {
			socket.emit("returnUserData", user)
		})

		socket.on("methodResult", (data) => {
			if (!data.success) {
				messages.log(`Client > ${data.message.trim()}`, "{red-fg}", "{/red-fg}")
			} else {
				if (data.method == "getMemberList") {
					this.memberList = data.memberList
					this._updateMemberList(members)
				}
			}
		})

		socket.on("method", (data) => {
			if (data.type != "serverRequest") return
			if (data.method == "userConnect") {
				if (this.memberList.indexOf(data.user) != -1) return
				this.memberList.push(data.user)
				this._updateMemberList(members)
			} else if (data.method == "userDisconnect") {
				let index = this.memberList.indexOf(data.user)
				if (index == -1) return
				this.memberList.splice(index, 1)
				this._updateMemberList(members)
			}
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}

	static _updateMemberList(members) {
		let list = JSON.parse(JSON.stringify(this.memberList)) // Deep cloning or we refrence the same list.
		if(list.length > 30){
			list.length = 30
		}
		for(let i = 0; i < list.length; i++){
			list[i] = `${this.textPrefix}${list[i]}${this.textSuffix}`
		}
		members.logLines = list
		members.setItems(members.logLines);
  	members.scrollTo(members.logLines.length);
	}

	static _handleCommands(message, messageLog, screen, ...handleArgs) {
		if (!message.startsWith("/")) return false

		const command = message.slice(1).split(" ")[0]
		const args = message.slice(command.length + 1).trim().split(" ")

		let colorRegex = /(#(\d|[a-f]){6})/i
		let matches;

		if (matches = colorRegex.exec(message)) {
			Utils.setMainTextColor(matches[1])
			this.textPrefix = `{${matches[1]}-fg}`
			this.textSuffix = `{/${matches[1]}-fg}`
			handleArgs[0].style.fg = Utils.config.chatColor
			messageLog.log(`Messages are now the color ${matches[1]}.`, this.textPrefix, this.textSuffix)

			return true
		} else if (command) {
			switch (command) {
				case "connect":
					const newSocket = io(args[0].startsWith("http") ? args[0] : `http://${args[0]}`)
					messageLog.log("Client > Connecting to different server...", this.textPrefix, this.textSuffix)
					newSocket.on('connect', () => {
						socket.disconnect()
						socket.removeAllListeners()
						Login.run(newSocket)
						screen.destroy()
					})
					return true
				default:
					return false
			}
		}
		return false
	}
}

function sanitize(text) {
	// If you can find another way to do this, let me know, we've tried
	// escaping it, zero width spaces, character codes.
	return blessed.escape(text)
	return text.replace(/[{}]/g, (ch) => {
		return ch === '{' ? '\u007B' : '\u007D'
	})
}

module.exports = ClientTUI;
