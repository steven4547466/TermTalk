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
			screen.destroy()
			require("./Register").run(socket)
		})
	
		form.on("submit", (data) => {
			if(!data.uid || !data.password) {
				console.log("\nNo data to use: %s", data)
			} else {
				socket.emit("login", data)
			}
		})

		socket.on("auth_result", (data) => {
			if (!data.success) {
				form.reset()
			} else {
				screen.destroy()
				require("./Client").run(socket)
			}
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}
}

module.exports = LoginTUI;
