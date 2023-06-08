// **************** REQUIREMENTS *****************
const cookieSession = require('cookie-session');
const express = require('express');
const bcrypt = require('bcryptjs');

// require helper functions
const {
  getUserByEmail,
  urlsForUser,
  doesUserOwnUrl,
  generateRandomString,
  isUserLoggedIn,
  doesShortUrlExists
} = require('./helpers');

// ***************** SETUP AND MIDDLEWARES *****************

// default port 8080
const PORT = 8080; 
const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');

// Express's body-parser to make buffer data readable
app.use(express.urlencoded({ extended: true }));

// Use Express's cookie-session middleware
app.use(cookieSession({
  name: 'session',
  keys: ['TINYAPP']
})); 

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'user1',
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'user1',
  },
};

// set test data users password as hashed passwords
const users = {  
  user1: {
    id: 'user1',
    email: 'user1@mail.com',
    password: '$2a$10$LsxauoK.pF6MVj8rs2rKxebb9eiggNZrWiSgZk.3OT7i7MmGxAQfa', 
  },
  user2: {
    id: 'user2',
    email: 'user2@mail.com',
    password: '$2a$10$42uu.WRccqQLgNgbpD6W0ulynx0SIRFS4c15PV.LgsRveXkTTe7Qm',
  },
};

// ***************** ROUTES / ENDPOINTS *****************

// homepage or root functionaloty. If user logged in then display urls else take to login page
app.get('/', (req, res) => {
  if (isUserLoggedIn(req)) {
    res.redirect('/urls');
  }
  else {
    res.redirect('/login');
  }
});

// new route to registration page
app.get('/register', (req, res) => {  

  // if user is logged in then redirect to url page
  if (isUserLoggedIn(req)) {   
    res.redirect('/urls');
  }
  else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('urls_register', templateVars);
  }
});

// POST route to handle the registration functionality
app.post('/register', (req, res) => { 
  const id = generateRandomString();

  // if user has not input email address or password then display relevant error
  if (!req.body.email || !req.body.password) { 
    return res.status(400).send('<h2>Email or password fields cannot be empty for user registration. </h2>');
  }
  
  // if email address doesnt exist in user database then add the user
  if (!getUserByEmail(req.body.email, users)) { 
    users[id] = {
      id,
      email: req.body.email,

      // Implemeneted bcrypt hash password before registering new user
      password: bcrypt.hashSync(req.body.password, 10) 
    }
    req.session.user_id = id;
    
    // redirect to index url page
    res.redirect('/urls'); 
  }
  else {
    return res.status(400).send('<h2>This email has already been registered with us!</h2>');
  }
});

// new route to login page
app.get('/login', (req, res) => {  
  
  // if user is logged in then redirect to url page
  if (isUserLoggedIn(req)) { 
    res.redirect('/urls');
  }
  else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('urls_login', templateVars);
  }
});

// logging in functionality
app.post('/login', (req, res) => { 
  
  // if entered email matches with users email in database
  const user = getUserByEmail(req.body.email, users); 

  if (!user) {
    //return res.status(403).send('The email is not registered');
    //return res.status(403).send('<html><body><b>This email is not registered</b></body></html>');
    return res.status(403).send('<h2>This Email is Not Registered!</h2>');
  }

  // use bcrypt to compare the password entered by user matches with hashed password saved in user database
  if (!bcrypt.compareSync(req.body.password, user.password)) { 
    return res.status(403).send('<h2>The password does not match. Please try again.</h2>');
  }
  
  //Sets user_id session with matching user's ID on successful login
  req.session.user_id = user.id; 
  res.redirect('/urls');
});

// if user is logged in then urls that belongs to him are shown, otherwise error is displayed that user has to register/signin to check the urls
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id] }; 
  if (isUserLoggedIn(req)) {
    res.render('urls_index', templateVars); 
  }
  else
    return res.status(403).send('<h2>Please register or login to access URLS</h2>');
});

// add new tinyurl in database and redirects the user to a new page that shows them the new url user has created
app.post('/urls', (req, res) => {
  const urlShortId = generateRandomString();
  urlDatabase[urlShortId] = {  
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${urlShortId}`); 
});


// if logged in, user can create a new url which is saved for him, if user not logged in then redirect to login page
app.get('/urls/new', (req, res) => { 
  if (isUserLoggedIn(req)) { 
    const templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  }
  else {
    res.redirect('/login');
  }
});

// displays both tiny (short url id) and long versions of the url
app.get('/urls/:id', (req, res) => { 
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, urls: urlsForUser(req.session.user_id, urlDatabase), urlUserID: urlDatabase[req.params.id].userID, user: users[req.session.user_id] }; 
  if (urlDatabase[req.params.id]) {
    res.render('urls_show', templateVars);
  }
});

// POST route that updates the URL resource
app.post('/urls/:id', (req, res) => { 
  
  // before update check if the short id exists in database
  if (!doesShortUrlExists(req.params.id, urlDatabase)) 
  {
    return res.send('<h2>This url does not exists!</h2>');
  }

  // before update check if the user is logged in into app
  if (!isUserLoggedIn(req)) 
  {
    return res.send('<h2>User is not logged in!</h2>');
  }

  // before update check if the short id is owned/created by user
  const userID = req.session.user_id
  if (!doesUserOwnUrl(userID, req.params.id, urlDatabase)) 
  {
    return res.send('<h2>This url does not belong to this user!</h2>');
  }

// Store the value of updated url against the shorturl selected
  urlDatabase[req.params.id].longURL = req.body.updatedURL; 
  res.redirect('/urls');

});

// checks the longURL in database against the short url and redirects to longURL
app.get('/u/:id', (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL; 
    if (longURL) {
      res.redirect(longURL);
    }
    else {
      res.status(404).send('<h2>The requested shortened URL does not exist.<h2>');
    }
  }
});

// POST route that removes a URL resource
app.post('/urls/:id/delete', (req, res) => { 
  
  // check if the short id exists in database
  if (!doesShortUrlExists(req.params.id, urlDatabase))  
  {
    return res.send('<h2>This url does not exists!</h2>');
  }
  
  // before delete check if the user is logged in into app
  if (!isUserLoggedIn(req))
  {
    return res.send('<h2>User is not logged in!</h2>');
  }

  // before delete check if the short id is owned/created by user
  const userID = req.session.user_id
  if (!doesUserOwnUrl(userID, req.params.id, urlDatabase)) 
  {
    return res.send('<h2>This url does not belong to this user!</h2>');
  }
  delete urlDatabase[req.params.id]
  res.redirect('/urls');
});

// log out and clear both session cookie and cookie signature and redirects to login
app.post('/logout', (req, res) => {
  res.clearCookie('session'); 
  res.clearCookie('session.sig');
  res.redirect('/login');
});


// ***************** LISTENERS *****************
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});