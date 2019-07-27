var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
var port = 8080;

var mongo = require('mongodb').MongoClient;

mongo.connect('mongodb://localhost/chatdb',function(err,db){
    if(err){
        throw err;
    }
    else{
        console.log('Mongo Connected')
        client.on('connection', function(socket){
            console.log("A new user is connected");
            let chat = db.collection('chats');

            // Function to send status
            SendStatus = function(s){
                socket.emit('status',s);
            }

            // Get chats from mongo connection
            chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
                if(err){
                    throw err;
                }
                // Emit the messages
                socket.emit('output',res);
            })

            // handle input event
            socket.on('input', function(data){
                let name = data.name
                let message = data.message
                if(name == '' || message == ''){
                    // Send error status
                    SendStatus('Please enter a name and message');
                }
                else{
                    // insert messages
                    chat.insert({name: name, message: message}, function(){
                        client.emit('output', [data]);

                        SendStatus({
                            message: 'Message sent',
                            clear: true
                        })
                    })
                }
            })

            // Handle clear
            socket.on('clear', function(data){
                //Remove all chats from collection
                chat.remove({}, function(){
                    socket.emit('cleared');
                })

            })
            socket.on('disconnect',function(){
                console.log("A user is disconnected");
            })
        })
    }
})

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
})

server.listen(port, function(){
    console.log('the server is listening at http://'+ip.address()+ ':'+port);
})