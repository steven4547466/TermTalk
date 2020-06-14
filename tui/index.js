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
const io = require("socket.io-client")
const blessed = require("blessed")
const fs = require("fs")
const Login = require("./src/Login")
const Utils = require("../src/Utils")

let publicServers = null
http.get("http://termtalkservers.is-just-a.dev:7680/list", res => {
	const status = res.statusCode
	if (status === 200) {
		res.setEncoding("utf8")
		let raw = ""

		res.on("data", (d) => raw += d)

		res.on("end", () => {
			try {
				publicServers = JSON.parse(raw)
			} catch (e) { }
		})
	}
})

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

const savedIPs = blessed.list({
	parent: form,
	top: 13,
	left: 'center',
	width: "30%",
	height: "60%",
	items: Utils.config.ips,
	tags: true,
	keys: true,
	border: {
		type: "line"
	},
	style: {
		selected: {
			fg: "white",
			bg: "blue"
		},
		border: {
			fg: "blue"
		}
	}
})

const savedIPsLabel = blessed.text({
	parent: screen,
	top: 13,
	left: "center",
	content: "Saved IPs"
})

const secureBox = blessed.checkbox({
	parent: form,
	checked: false,
	text: "Use SSL?",
	left: "73%",
	top: 6
})

pingSavedIPs()
setInterval(() => {
	pingSavedIPs()
	screen.render()
}, 6000)

savedIPs.on("select", (data, index) => {
	form.emit("submit", { ip: Utils.config.ips[index] })
})

connect.on("press", () => form.submit())

form.on("submit", (data) => {
	if (!data.ip) {
		error.content = "{center}Please enter the IP and port to connect to.{/center}"
		if (error.hidden) {
			error.toggle()
		}
		screen.render()
	} else {
		const reconnectionAttempts = 5
		const secure = secureBox.checked
		socket = secure ? io(data.ip.startsWith("https") ? data.ip : `https://${data.ip}`, { timeout: 5000, reconnectionAttempts, secure }) : io(data.ip.startsWith("http") ? data.ip : `http://${data.ip}`, { timeout: 5000, reconnectionAttempts })

		process.stdout.write("\u001b[0;0HConnecting...")

		let attempt = 0

		socket.on("connect_error", () => {
			process.stdout.write(`\u001b[0;0HUnable to establish connection to the server. Attempt ${++attempt}/${reconnectionAttempts}.`)
			if (attempt == reconnectionAttempts) {
				process.stdout.write(`\u001b[0;0H\u001b[2KUnable to establish a connection to the server after ${attempt} attempts.`)
				socket.close(true)
				socket.removeAllListeners()
			}
		})

		socket.on('connect', () => {
			socket.on("methodResult", (d) => {
				if (!d.success) {
					error.content = `{center}${d.message}{/center}`
					if (error.hidden) {
						error.toggle()
					}
					screen.render()
				} else {
					Utils.addToIps(data.ip)
					socket.removeAllListeners()
					Login.run(socket, data.ip)
					screen.destroy()
				}
			})
		})
	}
})

screen.key(["q", "C-c"], () => {
	process.exit();
})

screen.render()

async function pingSavedIPs() {
	let names = []
	for (let i = 0; i < Utils.config.ips.length; i++) {
		let data
		try {
			data = await pingIP(...Utils.config.ips[i].split(":"))
		} catch (e) {
			data = {
				name: `${ip}:${port}`,
				ip: ip,
				port: port,
				members: "unk",
				maxMembers: "unk"
			}
		}
		names.push(`${data.name} : ${data.members}/${data.maxMembers} ${data.secure ? "Secure" : ""}`)
	}
	savedIPs.setItems(names)
}

function pingIP(ip, port) {
	return new Promise((resolve) => {
		https.get(`https://${ip}:${port}/ping`, res => {
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
							name: `${ip}:${port}`,
							ip: ip,
							port: port,
							members: "unk",
							maxMembers: "unk"
						})
					}
				})
			}
		}).on("error", () => {
			http.get(`http://${ip}:${port}/ping`, res => {
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
								name: `${ip}:${port}`,
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
					name: `${ip}:${port}`,
					ip: ip,
					port: port,
					members: "unk",
					maxMembers: "unk"
				})
			})
		})
	})
}