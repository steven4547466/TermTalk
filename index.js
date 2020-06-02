const WebSocket = require('ws');
const connection = new WebSocket("ws://localhost:8080");
const repl = require('repl')
const replserv = new repl.REPLServer({
	prompt: "-> ", 
	eval: (input) => {
		const username = "sam"
		connection.send(JSON.stringify({username: username, msg: input}))
	}
})
connection.onopen = (event) => {
  process.stdout.clearLine()
    console.log("WebSocket is open now.");
    replserv.displayPrompt()
};

connection.onclose = (event) => {
    console.log("WebSocket is closed now.");
};

connection.onerror = (event) => {
    console.error("WebSocket error observed:", event);
};

connection.onmessage = (event) => {
  process.stdout.clearLine()
  const d = JSON.parse(event.data)
  console.log(`${d.username} > ${d.msg}`)
  replserv.displayPrompt()
};

replserv.on('exit', () => {
  process.exit();
});