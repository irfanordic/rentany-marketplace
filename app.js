require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./config/connection');
const { engine } = require('express-handlebars');
const createError = require('http-errors');
const session  = require('express-session');
const fileUpload = require('express-fileupload');
const http = require('http')
const { Server}  = require("socket.io")


const app = express();

const server = http.createServer(app)
const io = new Server(server)

// Socket.io setup
let activeUsers = {}

io.on('connection', (socket)=>{
    socket.on('join', (userId)=>{
        activeUsers[userId] = socket.id
        console.log('user Live :', userId)
    })


    socket.on('send-notification' , (data)=>{
        const ownerSocketId = activeUsers[data.ownerId]
        if(ownerSocketId){
            io.to(ownerSocketId).emit('get-notification', {
                message: `Incoming Request for ${data.productName}!`
            })
        }
    })

    socket.on('respond-to-request', (data)=>{
        console.log("1. Server received response for:", data.borrowerId);
        const borrowerSocketId  = activeUsers[data.borrowerId]
        console.log("2. Looking for borrower socket. Found:", borrowerSocketId);

        if(borrowerSocketId){
            console.log("3. Sending 'display-response' to borrower!");
            io.to(borrowerSocketId).emit('display-response', {
                message: `Your request for ${data.productName} has been ${data.status}!`,
                status: data.status
            })
        }else {
                console.log("ERROR: Borrower is not online or socket ID not found in activeUsers.");
            }
    })

    socket.on('disconnect', ()=>{
        for(let userId in activeUsers){
            if(activeUsers[userId] === socket.id){
               delete activeUsers[userId]
                console.log('user Disconnected :', userId)
                break

            }
        }
    })
})




// 1. View Engine setup (Fix that line break too!)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layout'), // Safer path
  partialsDir: path.join(__dirname, 'views', 'partials'),
  runtimeOptions: {
          allowProtoPropertiesByDefault: true,
          allowProtoMethodsByDefault: true
      },
  helpers: {
          substring: function (str, start, end) {
              return str ? str.toString().substring(start, end) : "";
          },
          eq: function (v1, v2) {
                      return v1 === v2;
                  }
  },
 
  // ... rest of your options
}));

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000  } // 10 minutes
})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: true, 
    uploadTimeout: 0 
}));

// 3. Routes
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
app.use('/', userRouter);
app.use('/admin', adminRouter);


// 6. DB Connection & Server Start (KEEP THIS AT THE VERY BOTTOM)
db.connect((err) => {
    if (err) {
        console.log("Connection Error", err);
    } else {
        server.listen(3000, () => {
            console.log("Server running on port 3000 mit websockets");
            console.log("Database connected");
        });
    }
});