const socket = require('socket.io-client')('http://localhost:3000');
const repl = require('repl')
const { prompt, Input } = require('enquirer')

socket.on('disconnect', function() {
	socket.emit('Disconnected from the server.')
})

socket.on('connect', async () => {
	process.stdout.clearLine()
	console.log("Connected to the server.")
	const response = await prompt([
	  {
	    type: "input",
	    name: "username",
	    message: "What is your username?"
	  },
	  {
	    type: "password",
	    name: "pass",
	    message: "What is your password?"
	  }
	]);
 
	socket.emit("login", response)
	socket.on("ready", () => {
		new Input({
		  type: "input",
		  name: "msg",
		  message: ""
		}).run().then(msg => {
			console.log(msg)
			const username = response.username
			socket.send({msg, username})
		}).catch(err => {
			console.error(err)
			process.exit(1)
		})
	})
})
/*const replserv = new repl.REPLServer({
	prompt: "-> ", 
	eval: (input) => {
		const username = "sammy"
		socket.send({input, username})
	}
})*/
socket.on('message', (data) => {
	process.stdout.clearLine()
	const { message } = data
	console.log(username + ': ' + input.split('\n')[0]);
	replserv.displayPrompt()
})
/*replserv.on('exit', () => {
  process.exit();
});*/
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