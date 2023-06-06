
const getUserByEmail = (email, userDatabase) => { // helper function for user lookup through email address
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user]; // returns the user with matching email address
    }
  }
  return undefined; // return undefined for an email not present in database
}

const urlsForUser = (userId, urlDatabase) => {
  const userUrls = {};
  for (const urlShortId in urlDatabase) {
    if (urlDatabase[urlShortId].userID === userId) {
      userUrls[urlShortId] = urlDatabase[urlShortId];
    }
  }
  return userUrls; // returns the URLs where the userID is equal to the id of the currently logged-in user.
}; 

const doesUserOwnUrl = (userId, urlShortId, urlDatabase) => {
  userUrls = urlsForUser(userId, urlDatabase );
  for (const userUrl in userUrls) {
    if (userUrl === urlShortId) {
      return true
    }
  }
  return false;
};

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = () => { // generate shorturl/id string of 6 alphanumeric charcters   
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

const isUserLoggedIn = (req) => {
  if (req.session.user_id)
    return true;
  else
    return false;
};

const doesShortUrlExists = (urlShortId, urlDatabase) => {
  if (urlDatabase.hasOwnProperty(urlShortId))
    return true
  else
    return false
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  doesUserOwnUrl,
  generateRandomString,
  isUserLoggedIn,
  doesShortUrlExists
}; // export helper functions