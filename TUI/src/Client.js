const blessed = require("blessed");

class ClientTUI {
	static run(socket) {
		const screen = blessed.screen({
			smartCSR: true,
			title: "TermTalk Client"
		})
		
		const label = blessed.text({
			parent: screen,
			top: 4,
			left: "center",
			content: "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP: "
		})

		screen.key(["q", "C-c"], () => {
			process.exit();
		})

		screen.render()
	}
}

module.exports = ClientTUI;
