// **************** REQUIREMENTS *****************
const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");


// ***************** SETUP AND MIDDLEWARES *****************
const PORT = 8080; // default port 8080
const app = express();
app.set("view engine", "ejs"); // Set EJS as view engine
app.use(express.urlencoded({ extended: true })); // Express's body-parser to make buffer data readable
app.use(cookieSession({
    name: 'session',
    keys: ['TINYAPP']
})); // Use Express's cookie-session middleware

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user1",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user1",
  },
};

const users = {  // create global users object
  user1: {
    id: "user1",
    email: "user1@mail.com",
    password: "user1"
  },
  user2: {
    id: "user2",
    email: "user2@mail.com",
    password: "user2"
  },
};

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = () => { // generate shorturl/id string of 6 alphanumeric charcters   
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

const getUserByEmail = (email) => { // helper function for user lookup through email address
  for (const user in users) {
    if (users[user].email === email) {
      return users[user]; // returns the user with matching email address
    }
  }
  return null;
}

const urlsForUser = (userId) => {
  const userUrls = {};
  for (const urlShortId in urlDatabase) {
    if (urlDatabase[urlShortId].userID === userId) {
      userUrls[urlShortId] = urlDatabase[urlShortId];
    }
  }
  return userUrls; // returns the URLs where the userID is equal to the id of the currently logged-in user.
};

const isUserLoggedIn = (req) => {
  if (req.session.user_id)
    return true;
  else
    return false;
};

const doesShortUrlExists = (urlShortId) => {
  if (urlDatabase.hasOwnProperty(urlShortId))
    return true
  else
    return false
}

const doesUserOwnUrl = (userId, urlShortId) => {
  userUrls = urlsForUser(userId);
  for (const userUrl in userUrls) {
    if (userUrl === urlShortId) {
      return true
    }
  }
  return false;
};

// ***************** ROUTES / ENDPOINTS *****************
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
  const templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] }; // update route to use new user_id session and data in users object
  if (isUserLoggedIn(req)) {
    res.render("urls_index", templateVars); // pass the URL data to url view template
  }
  else
    return res.status(403).send("<h2>Please register or login to access URLS<h2>");
});

app.get("/urls/new", (req, res) => { // route handler to render page with the form
  if (isUserLoggedIn(req)) { // if user is logged in then redirect to login page
    const templateVars = { user: users[req.session.user_id] }; // update route to use new user_id session and data in users object
    res.render("urls_new", templateVars);
  }
  else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {  // new route to render individual urls by id
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, urls: urlsForUser(req.session.user_id), urlUserID: urlDatabase[req.params.id].userID, user: users[req.session.user_id] }; // update route to use new user_id session and data in users object
  if (urlDatabase[req.params.id]) {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL; // capture longURL from database against /u/:id"
    if (longURL) {
      res.redirect(longURL);
    }
    else {
      res.status(404).send("<h2>The requested shortened URL does not exist<h2>");
    }
  }
});

app.get("/register", (req, res) => {  // new route to registration page
  if (isUserLoggedIn(req)) { // if user is logged in then redirect to url page
    res.redirect(`/urls`);
  }
  else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req, res) => {  // new route to login page
  if (isUserLoggedIn(req)) { // if user is logged in then redirect to url page
    res.redirect(`/urls`);
  }
  else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const urlShortId = generateRandomString();
  urlDatabase[urlShortId] = {  // Update according to new db structure
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${urlShortId}`); //redirect the user to a new page that shows them the new short url they created
});

app.post("/urls/:id", (req, res) => { // POST route that updates the URL resource
  if (!doesShortUrlExists(req.params.id)) // before update check if the short id exists in database
  {
    return res.send('This url does not exists!');
  }

  if (!isUserLoggedIn(req)) // before update check if the user is logged in into app
  {
    return res.send('User is not logged in!');
  }

  const userID = req.session.user_id
  if (!doesUserOwnUrl(userID, req.params.id)) // before update check if the short id is owned/created by user
  {
    return res.send('This url does not belong to this user!');
  }

  urlDatabase[req.params.id].longURL = req.body.updatedURL; // Store the value of updated url against the shorturl selected
  res.redirect(`/urls`);

});

app.post("/urls/:id/delete", (req, res) => { // POST route that removes a URL resource
  if (!doesShortUrlExists(req.params.id))  // check if the short id exists in database
  {
    return res.send('This url does not exists!');
  }
  if (!isUserLoggedIn(req))// before delete check if the user is logged in into app
  {
    return res.send('User is not logged in!');
  }
  const userID = req.session.user_id
  if (!doesUserOwnUrl(userID, req.params.id)) // before delete check if the short id is owned/created by user
  {
    return res.send('This url does not belong to this user!');
  }
  delete urlDatabase[req.params.id]
  res.redirect('/urls');
});

app.post("/login", (req, res) => { // POST route to handle the /login
  const user = getUserByEmail(req.body.email); // if entered email matches with users email in database
  if (!user) {
    return res.status(403).send('The email is not registered');
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) { // use bcrypt to compare the password entered by user matches with hashed password saved in user database
    return res.status(403).send('The password does not match. Please try again.');
  }
  req.session.user_id = user.id; //Sets user_id session with matching user's ID on successful login
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => { // POST route to handle the /logout
  res.clearCookie('session'); //Clear the session cookie on pressing the logout button
  res.redirect(`/login`); // redirect to login page
});

app.post("/register", (req, res) => { // POST route to handle the /register functionality
  const id = generateRandomString();

  if (!req.body.email || !req.body.password) { // if user has not input email address or password
    return res.status(400).send('Email or password fields cannot be empty for user registration');
  }
  if (!getUserByEmail(req.body.email)) { // if email address doesnt exist in user database then add the user
    users[id] = {
      id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) // Implemeneted bcrypt hash password
    }
    console.log(users)
    req.session.user_id = id;
    res.redirect(`/urls`); // redirect to index url page
    }
  else {
    return res.status(400).send('This email has already been registered with us!');
  }
});

// ***************** LISTENERS *****************
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});