const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // Set EJS as view engine
app.use(express.urlencoded({ extended: true })); // Express's body-parser to make buffer data readable

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); // pass the URL data to url view template
});

app.get("/urls/new", (req, res) => { // route handler to render page with the form
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {  // new route to render individual urls by id
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]; // capture longURL from database against /u/:id"
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; // id-longURL key-value pair are saved to the urlDatabase
  res.redirect(`/urls/${shortURL}`); //redirect the user to a new page that shows them the new short url they created
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});