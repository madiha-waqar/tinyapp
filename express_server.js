const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Set EJS as view engine
app.use(express.urlencoded({ extended: true })); // Express's body-parser to make buffer data readable
app.use(cookieParser()); // Use Express's cookie-parser


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  user1: {
    id: "user1",
    email: "user1@mail.com",
    password: "user1",
  },
  user2: {
    id: "user2",
    email: "user2@mail.com",
    password: "user2",
  },
};

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = () => { // generate shorturl/id string of 6 alphanumeric charcters   
  let id = ' ';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

app.get("/", (req, res) => {
  res.send("Hello!"); // response can contain somple string
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // response can contain JSON object
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n"); // response can contain HTML code
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username']}; // update route for login-username 
  res.render("urls_index", templateVars); // pass the URL data to url view template
});

app.get("/urls/new", (req, res) => { // route handler to render page with the form
  const templateVars = {username: req.cookies['username']}; //// update route for login-username 
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {  // new route to render individual urls by id
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies['username'] }; // update route for login-username 
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // capture longURL from database against /u/:id"
  if (longURL) {
    res.redirect(longURL);
  }
  else {
    res.statusCode = 404;
    res.send("404 Page Not Found");
  }
});

app.get("/register", (req, res) => {  // new route to registration page
  const templateVars = { username: req.cookies['username'] }; 
  res.render("urls_register", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; // id-longURL key-value pair are saved to the urlDatabase
  res.redirect(`/urls/${shortURL}`); //redirect the user to a new page that shows them the new short url they created
});

app.post("/urls/:id", (req, res) => { // POST route that updates the URL resource
  urlDatabase[req.params.id] = req.body.updatedURL; // Store the value of updated url against the shorturl selected
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => { // POST route that removes a URL resource
  delete urlDatabase[req.params.id]
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => { // POST route to handle the /login
  res.cookie('username',req.body.username); //Store a cookie with name=username and value=username coming from login form
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => { // POST route to handle the /logout
  res.clearCookie('username'); //Clear the cookie on pressing the logout button
  res.redirect(`/urls`); // redirect to index url page
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});