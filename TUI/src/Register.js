const blessed = require("blessed");
class RegisterTUI {
	static run(socket) {
		const screen = blessed.screen({
			smartCSR: true,
			title: "TermTalk Register"
		})
	
		const form = blessed.form({
			parent: screen,
			width: "100%",
			left: "center",
			keys: true,
			vi: true
		})

		// Error box
		const error = blessed.box({
			parent: screen,
			left: "75%",
			top: "center",
			width: "18%",
			height: 4,
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
		const uidLabel = blessed.text({
			parent: screen,
			top: 4,
			left: "center",
			content: "Account Name (UID): "
		})

		const usernameLabel = blessed.text({
			parent: screen,
			top: 9,
			left: "center",
			content: "Username: "
		})

		const tagLabel = blessed.text({
			parent: screen,
			top: 14,
			left: "center",
			content: "Tag (4 characters that appear after your name): "
		})

		const passwordLabel = blessed.text({
			parent: screen,
			top: 19,
			left: "center",
			content: "Password: "
		})

		// Textboxes
		const uid = blessed.textarea({
			parent: form,
			name: "uid",
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

		const username = blessed.textarea({
			parent: form,
			name: "username",
			top: 10,
			left: "center",
			height: 3,
			width: "40%",
			inputOnFocus: true,
			content: "first",
			border: {
				type: "line"
			}
		})

		const tag = blessed.textarea({
			parent: form,
			name: "tag",
			top: 15,
			left: "center",
			height: 3,
			width: "40%",
			inputOnFocus: true,
			content: "first",
			border: {
				type: "line"
			}
		})

		const password = blessed.textbox({
			parent: form,
			name: "password",
			top: 20,
			left: "center",
			height: 3,
			width: "40%",
			inputOnFocus: true,
			content: "first",
			border: {
				type: "line"
			},
			censor: true
		})
	
		// Buttons
		const register = blessed.button({
			parent: form,
			name: "register",
			content: "Register",
			top: 25,
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
				bg: "green",
				focus: {
					inverse: true
				}
			}
		})

		register.on('press', () => {
			form.submit();
		})
	
		form.on("submit", (data) => {
			if(!data.uid || !data.password || !data.tag || !data.username) {
				error.content = "{center}Please enter all the information.{/center}"
				error.height = 4
				if(error.hidden){ 
					error.toggle()
				}
				form.reset()
				screen.render()
			} else {
				if(!error.hidden){ 
					error.toggle()
					screen.render()
				}
				socket.emit("register", data)
			}
		})

		socket.on("auth_result", (data) => {
			if (!data.success) {
				error.content = "{center}" + data.message + "{/center}"
				error.height = 5
				if(error.hidden){ 
					error.toggle()
				}
				form.reset()
				screen.render()
			} else {
				register.removeAllListeners()
				form.removeAllListeners()
				socket.removeAllListeners()
				require("./Client").run(socket, data.user)
				screen.destroy()
			}
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}
}

module.exports = RegisterTUI;