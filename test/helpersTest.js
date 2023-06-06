const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const userDB = {
  'A': {
    id: 'user1',
    email: 'user1@mail.com',
    password: 'user1'
  },
  'B': {
    id: 'user2',
    email: 'user2@mail.com',
    password: 'user2'
  }
};

describe('getUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const actual = getUserByEmail('user1@mail.com', userDB); // returns user object 'A'
    const expected = userDB.A;
    assert.equal(actual, expected);
  });

  it('should return undefined with a non existing email', () => {
    const actual = getUserByEmail('nouser@mail.com', userDB); // returns undefined
    const expected = undefined;
    assert.equal(actual, expected);
  });
});