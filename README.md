<strong><p align="center">TermTalk is a simple and straightforward way of talking to your peers in the terminal.</p></strong>
An easy CLI interface to just send and receive messages.  
To use TermTalk you need to host a server of your own. The server can be located at [Terminalfreaks/TermTalk-Server](https://github.com/Terminalfreaks/TermTalk-Server) and is regularly updated with the client here.  

It is still being developed but is currently very usable, and even has password hashing!

## Server
Our Discord server can be located here: https://discord.gg/GBzFGPe  
I can't actually host a TermTalk server but you can find others there.

# Screenshot
soontm

# Installation
```
git clone https://github.com/Terminalfreaks/TermTalk
cd TermTalk
npm install
npm link
```  
Now you can run `termtalk`.  
If you don't want to link, the script `termtalk` is available: 
```
npm run termtalk
```  

# Documentation
Here is a bit of the way on how it works. It's a Socket.io server that waits for a connected client to send login information or registration information.  

For a login, it asks for account name and password. Internally account name is called UID.  
For a register it asks for account name, username, tag (like a discord discriminator) and password.  

Once you do either one the server provides you with information to use for sending message and sends you to the authed room.  
The server sends session ID, your username, your tag and account name. You **need** to send session ID or the server will not accept your message and send an error.  

I'll get into more detail with what the server sends later.

Check out [creating a client](creating_a_client.md)
