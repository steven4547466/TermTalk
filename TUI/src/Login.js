const blessed = require("blessed");

class LoginTUI {
	static run(socket) {
		const screen = blessed.screen({
			smartCSR: true,
			title: "TermTalk Login"
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
			left: "center",
			top: 20,
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
			content: "Account Name (UID): "
		})
		const passwordLabel = blessed.text({
			parent: screen,
			top: 9,
			left: "center",
			content: "Password: "
		})

		// Textboxes
		const username = blessed.textarea({
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
		const password = blessed.textbox({
			parent: form,
			name: "password",
			top: 10,
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
		var login = blessed.button({
			parent: form,
			name: "login",
			content: "Login",
			top: 15,
			left: 46,
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
		const register = blessed.button({
			parent: form,
			name: "register",
			content: "Register Instead",
			top: 15,
			left: 60,
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

		login.on('press', () => {
			form.submit();
		})
	
		register.on("press", () => {
			register.removeAllListeners()
			login.removeAllListeners()
			socket.removeAllListeners()
			form.removeAllListeners()
			require("./Register").run(socket)
			screen.destroy()
		})
	
		form.on("submit", (data) => {
			if(!data.uid || !data.password) {
				error.content = "{center}Please enter your username and password.{/center}"
				if(error.hidden){ 
					error.toggle()
				}
				screen.render()
			} else {
				if(!error.hidden){ 
					error.toggle()
					screen.render()
				}
				socket.emit("login", data)
			}
		})

		socket.on("auth_result", (data) => {
			if (!data.success) {
				error.content = "{center}" + data.message + "{/center}"
				if(error.hidden){ 
					error.toggle()
				}
				form.reset()
				screen.render()
			} else {
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

module.exports = LoginTUI;
