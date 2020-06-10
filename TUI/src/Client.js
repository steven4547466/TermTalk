const blessed = require("blessed");

class ClientTUI {
	static run(socket, user) {
		const screen = blessed.screen({
			smartCSR: true,
			title: "TermTalk Client"
		})
		
		const label = blessed.text({
			parent: screen,
			top: 4,
			left: "center",
			content: "P: "
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}
}

module.exports = ClientTUI;
