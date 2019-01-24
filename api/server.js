require('dotenv').config();
const express = require('express');
const helmet = require('helmet')
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('../database/helpers/dbHelpers.js');
const jwt = require('jsonwebtoken');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

// **********************************************************************

function generateToken(user) {
  const payload = {
    username: user.username,
    name: user.name,
    roles: ['admin', 'accountant'] // should come from the database user.roles
  }

  const secret = process.env.JWT_SECRET; // bad practice because of env, it can be hackable

  const options = {
    expiresIn: '45m' // 10 mins... otherValues('60', '2 days', '10h', '7d')
  };

  return jwt.sign(payload, secret, options);
}

function lock(req, res, next) {
  // the auth token is normally sent in the authorization header
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        res.status(401).json({ message: 'invalid token' });
      } else {
        req.decodedToken = decodedToken;
        next();
      }
    })
  } else {
    res.status(401).json({ message: 'no token provided' });
  }
}

function checkRole(role) {
  return function (req, res, next) {
    if (req.decodedToken.roles.includes(role)) {
      next();
    } else {
      res.status(403).json({ message: `you need to be an ${role}` })
    }
  }
}

// **********************************************************************

server.get('/', (req, res) => {
  res.send('sanity check');
});

server.post('/register', (req, res) => {
  const userInfo = req.body;

  // Hash the password
  userInfo.password = bcrypt.hashSync(userInfo.password, 14); // overwrite password as soon as possible with the hash algorithm, 14 adds complexity to the hash algorithm (14 is a good baseline, go higher if needed... will require more log in time)

  // Add the user to the database
  db.addUser(userInfo)
    .then(ids => {
      res.status(201).json({ id: ids[0] });
    })
    .catch(err => {
      res.status(500).send(err);
    })
})

// protect this endpoint so only logged in users can see it
server.get('/users', lock, checkRole('admin'), async (req, res) => {
  const users = await db.getAllUsers('users')
    .select('id', 'username', 'name');

  res.status(200).json({ users, decodedToken: req.decodedToken });
});

// protect this endpoint so only logged in users can see it
server.get('/users/me', lock, checkRole('accountant'), (req, res) => {
  db.getAllUsers()
    .where({ username: req.decodedToken.username })
    .first()
    .then(Users => {
      res.status(200).json(Users)
    })
    .catch(err => res.send(err))
});

// protect this endpoint so only logged in users can see it
server.get('/users/:id', lock, (req, res) => {
  db.getAllUsers()
    .where({ id: req.params.id })
    .first()
    .then(Users => {
      res.status(200).json(Users)
    })
    .catch(err => res.send(err))
});

server.post('/login', (req, res) => {
  // Precondition - Username must be unique
  // check that username exists AND that passwords match
  const creds = req.body;


  db.findByUsername(creds.username)
    .first() // returns the first single object (containing the user found) in the array. If no objects were found, an empty array is returned.
    .then(user => {
      const token = generateToken(user);
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        // another option...
        // req.session.user = user;

        res.json({ message: `welcome ${user.name}`, token })
      } else {
        res.status(401).json({ you: "shall not pass!!" })
      }
    })
    .catch(err => res.status(500).send(err));
})

// protect this route, only authenticated users should see it
server.get('/api/users', (req, res) => {
  db('users')
    .select('id', 'username')
    .then(users => {
      res.json(users); // no res.status() is auto-set to 200
    })
    .catch(err => res.send(err));
});

/***************************************************************************************************
 ********************************************* export(s) *******************************************
 **************************************************************************************************/
module.exports = server;