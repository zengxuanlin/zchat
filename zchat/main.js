const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

const users = [];
const _sockets = [];
let online_person_no = 0;
server.listen(3000,()=>{
   console.log('zchat running at http://localhost:3000');
});
app.use(express.static(path.join(__dirname,'./public')));
app.set('views',path.join(__dirname,'./views'));
app.engine('html',require('ejs').__express);
app.set('view engine','html');
app.get('/',(req,res)=>{
    res.render('chat');
});
io.on('connection',function(socket){
    online_person_no++;

    console.log(online_person_no + '位用户连接了');

    socket.on('login',function(data){
        socket.username = data.username;
        users.forEach(function(user){
            if(user.username === socket.username){
                socket.username = null;
                socket.emit('usernameErr',{err: '用户名存在'});
            }
        });
        if( socket.username !== null){
            let imgSrc = (Math.random()*10) || 0;
            users.push({
                username:data.username,
                message : [],
                dataUrl: [],
                loginTime : new Date().toLocaleString(),
                imgSrc,
                id:socket.id
            });
            _sockets[data.username] = socket;
            data.userGroup = users;
            data.imgSrc = imgSrc;
            data.userId = socket.id;
            socket.emit('LoginSuccess',data);
            socket.broadcast.emit('LoginSuccess',data);
        }
    });
    socket.on('message',function(data){
        users.forEach(function(user){
            if(user.username === socket.username) {
                user.message.push(data.message);
                data.imgSrc = user.imgSrc;
            }
        });
        console.log(data);
        socket.broadcast.emit('receiveMsg',data);
        socket.emit('receiveMsg',data);
    });

    socket.on('disconnect',function(){
        online_person_no--;
        users.forEach(function(item,index){
            if(item.username === socket.username){
                console.log('删除好友'+item.username);
                users.splice(index,1);
            }
        });
        socket.broadcast.emit('userLeave',{username: socket.username,userId:socket.id});
    });

    socket.on('sendImg',function (data) {
        users.forEach(item=>{
            if(item.username === data.username){
                item.dataUrl.push(data.imgUrl);
                data.imgSrc = item.imgSrc;
            }
        });
        io.emit('receiveImg',data);
    })
});
