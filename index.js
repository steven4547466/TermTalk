const socket = require('socket.io-client')('http://localhost:3000');
const repl = require('repl')
const replserv = new repl.REPLServer({
	prompt: "-> ", 
	eval: (input) => {
		const username = "sammy"
		socket.send({input, username})
	}
})
socket.on('disconnect', function() {
	socket.emit('disconnect')
})

socket.on('connect', () => {
	process.stdout.clearLine()
	console.log("Connected")
	replserv.displayPrompt()

})

socket.on('message', (data) => {
	process.stdout.clearLine()
	const { input, username } = data
	console.log(username + ': ' + input.split('\n')[0]);
	replserv.displayPrompt()
})

replserv.on('exit', () => {
  process.exit();
});
/*const ci = rl.createInterface({
	input: process.stdin,
	output: process.stdout
})

prompt = () => {
	ci.setPrompt("-> ")
	ci.prompt()
}

ci.on("line", (input) => {
	const username = "sammy"
	socket.send({input, username})
	prompt()
})

ci.on('SIGINT', () => {
	ci.close()
});

ci.on('close', () => {
	console.log("Goodbye!")
	process.exit(0)
});*/