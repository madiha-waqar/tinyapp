
const getUserByEmail = (email, userDatabase) => { // helper function for user lookup through email address
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user]; // returns the user with matching email address
    }
  }
  return null;
}

module.exports = getUserByEmail;