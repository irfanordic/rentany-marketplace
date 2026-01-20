require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./config/connection');
const { engine } = require('express-handlebars');
const createError = require('http-errors');
const session  = require('express-session');

const app = express();

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
        app.listen(3000, () => {
            console.log("Server running on port 3000");
            console.log("Database connected");
        });
    }
});