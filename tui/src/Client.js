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

const http = require("http")
const https = require("https")
const blessed = require("blessed")
const contrib = require("blessed-contrib")
const io = require("socket.io-client")
const Login = require("./Login")
const Utils = require("../../src/Utils")

class ClientTUI {

	static textPrefix = `{${Utils.config.chatColor}-fg}`
	static textSuffix = `{/${Utils.config.chatColor}-fg}`
	static memberList = []

	static run(socket, user, connectedIP) {
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

		const connectedIPText = blessed.text({
			parent: screen,
			top: 0,
			content: ` Connected to: ${connectedIP}.`
		})

		pingIP(connectedIP).then(t => {
			connectedIPText.setContent(`${t.secure ? "Securely connected" : "Connected"} to ${t.name}.`)
		})

		const grid = new contrib.grid({ rows: 10, cols: 10, screen: screen })
		const messages = grid.set(0.5, 0, 9, 8, contrib.log, {
			label: "Messages",
			tags: true,
			style: {
				fg: "green",
				border: {
					fg: "cyan"
				}
			},
			screen: screen,
			bufferLength: screen.height
		})
		const members = grid.set(0.5, 8, 9, 2, contrib.log, {
			label: "Members",
			tags: true,
			style: {
				fg: "green",
				border: {
					fg: "cyan"
				}
			},
			bufferLength: screen.height
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

		screen.on("resize", () => {
			messages.options.bufferLength = screen.height
			members.options.bufferLength = screen.height

			while (messages.logLines.length > screen.height) {
				messages.logLines.shift()
			}

			while (members.logLines.length > screen.height) {
				members.logLines.shift()
			}

			messages.setItems(messages.logLines)
			messages.scrollTo(messages.logLines.length)

			members.setItems(members.logLines)
			members.scrollTo(members.logLines.length)
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
			if (this._handleCommands(msg.trim(), messages, screen, {messageBox, connectedIP})) return
			socket.emit("msg", { msg, username: user.username, tag: user.tag, uid: user.uid, id: user.id, sessionID: user.sessionID })
		})

		socket.on('msg', (data) => {
			if (data.server) return messages.log(`${data.loadHistory ? "" : this._getTime()} ${data.username}#${data.tag} > ${data.msg}`, "{white-fg}", "{/white-fg}")
			let reg = new RegExp(`(@${user.username}#${user.tag})`, "g")
			data.msg = data.msg.replace(reg, "{inverse}$1{/inverse}")
			messages.log(`${this._getTime()} ${data.username}#${data.tag} > ${data.msg}`, this.textPrefix, this.textSuffix)
		})

		socket.on("disconnect", () => {
			messages.log(`${this._getTime()} Client > You have been disconnected.`, "{red-fg}", "{/red-fg}")
		})

		socket.on("reconnect", (attempt) => {
			messages.log(`${this._getTime()} Client > Reconnected after ${attempt} attempt(s).`, "{red-fg}", "{/red-fg}")
		})

		socket.on("reconnect_attempt", (attempt) => {
			messages.log(`${this._getTime()} Client > Attempting reconnect. #${attempt}`, "{red-fg}", "{/red-fg}")
		})

		socket.on("getUserData", () => {
			socket.emit("returnUserData", user)
		})

		socket.on("methodResult", (data) => {
			if (!data.success) {
				messages.log(`${this._getTime()} Client > ${data.message.trim()}`, "{red-fg}", "{/red-fg}")
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
			}else if(data.method == "sendChatHistory"){
				let start = data.history.length - screen.height
				for(let i = start < 0 ? 0 : start; i < screen.height - 1; i++){
					if(!data.history[i]) break
					messages.log(`${data.history[i].username}#${data.history[i].tag} > ${data.history[i].msg}`, "{white-fg}", "{/white-fg}")
				}
			}
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}

	static _updateMemberList(members) {
		let list = JSON.parse(JSON.stringify(this.memberList)) // Deep cloning or we refrence the same list.
		let index
		if ((index = list.findIndex(t => !t.includes("#") && t.includes("lurker(s)"))) !== -1) {
			list.splice(0, 0, list.splice(index, 1)[0])
		}

		if (list.length > members.options.bufferLength) {
			list.length = members.options.bufferLength
		}

		if (!list[0].includes("#") && list[0].includes("lurker(s)")) {
			list.splice(list.length - 1, 0, list.splice(0, 1)[0])
		}

		for (let i = 0; i < list.length; i++) {
			list[i] = `${this.textPrefix}${list[i]}${this.textSuffix}`
		}

		members.logLines = list
		members.setItems(members.logLines)
		members.scrollTo(members.logLines.length)
	}

	static _handleCommands(message, messageLog, screen, handleArgs) {
		if (!message.startsWith("/")) return false

		const command = message.slice(1).split(" ")[0]
		const args = message.slice(command.length + 1).trim().split(" ")

		let colorRegex = /(#(\d|[a-f]){6})/i
		let matches;

		if (matches = colorRegex.exec(message)) {
			Utils.setMainTextColor(matches[1])
			this.textPrefix = `{${matches[1]}-fg}`
			this.textSuffix = `{/${matches[1]}-fg}`
			handleArgs.messageBox.style.fg = Utils.config.chatColor
			messageLog.log(`Messages are now the color ${matches[1]}.`, this.textPrefix, this.textSuffix)

			return true
		} else if (command) {
			switch (command) {
				case "connect":
					if (!args[0]) {
						messageLog.log("Client > No IP provided.", "{red-fg}", "{/red-fg}")
						return true
					}
					const reconnectionAttempts = 3
					const newSocket = io(args[0].startsWith("http") ? args[0] : `http://${args[0]}`, { timeout: 5000, reconnectionAttempts })
					messageLog.log("Client > Connecting to different server...", this.textPrefix, this.textSuffix)

					let attempt = 0

					newSocket.on("connect_error", () => {
						messageLog.log(`Client > Unable to establish connection to the server attempt: ${++attempt}.`, "{red-fg}", "{/red-fg}")
						if (attempt == reconnectionAttempts) {
							messageLog.log(`Client > Unable to establish connect to server after ${attempt} attempts.`, "{red-fg}", "{/red-fg}")
							newSocket.close(true)
							newSocket.removeAllListeners()
						}
					})
					
					newSocket.on('connect', () => {
						newSocket.on("methodResult", (d) => {
							if(!d.success) {
								messageLog.log(`Client > Connecting failed: ${d.message}`, this.textPrefix, this.textSuffix)
							} else {
								Utils.addToIps(args[0])
								socket.close(true)
								socket.removeAllListeners()
								newSocket.removeAllListeners()
								Login.run(newSocket, args[0])
								screen.destroy()
							}
						})
					})
					return true
				break;

				default:
					return false
				break;
			}
		}
		return false
	}

	static _getTime() {
		return `[${new Intl.DateTimeFormat({}, {timeStyle: "short", hour12: true}).format(new Date())}]`
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

function pingIP(ip) {
	return new Promise((resolve) => {
		https.get(`https://${ip}/ping`, res => {
			const status = res.statusCode
			if (status === 200) {
				res.setEncoding("utf8")
				let raw = ""

				res.on("data", (d) => raw += d)

				res.on("end", () => {
					try {
						return resolve(JSON.parse(raw))
					} catch (e) {
						return resolve({
							name: ip,
							ip: ip,
							port: port,
							members: "unk",
							maxMembers: "unk"
						})
					}
				})
			}
		}).on("error", () => {
			http.get(`http://${ip}/ping`, res => {
				const status = res.statusCode
				if (status === 200) {
					res.setEncoding("utf8")
					let raw = ""

					res.on("data", (d) => raw += d)

					res.on("end", () => {
						try {
							return resolve(JSON.parse(raw))
						} catch (e) {
							return resolve({
								name: ip,
								ip: ip,
								port: port,
								members: "unk",
								maxMembers: "unk"
							})
						}
					})
				}
			}).on("error", () => {
				return resolve({
					name: ip,
					ip: ip,
					port: port,
					members: "unk",
					maxMembers: "unk"
				})
			})
		})
	})
}

module.exports = ClientTUI;
