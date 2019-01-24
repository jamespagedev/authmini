
const express = require('express');
const helmet = require('helmet')
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('../database/helpers/dbHelpers.js');
const dbKnex = require('../database/dbConfig.js');


const server = express();

const sessionConfig = {
  name: 'TutorialDemo', // default is sid
  secret: 'asdfasdasa', // used for cookie
  cookie: {
    // maxAge: 1000 * 60 * 10, // session will be good for 10 minutes (milliseconds)
    // maxAge: 1000 * 15, // session will be good for 15 seconds (milliseconds)
    // maxAge: 1000 * 60 * 5, // session will be good for 5 minutes (milliseconds)
    maxAge: 1000 * 60, // session will be good for 1 minute (milliseconds)
    secure: false // Only send the cookie over https, Set to true in production 
  },
  httpOnly: true, // js can't touch this cookie
  // read about these two options: set correctly to avoid trouble
  // https://www.npmjs.com/package/express-session
  resave: false,
  saveUninitialized: false,
  store: new KnexSessionStore({ // used to save session if server restarts
    tablename: 'sessions',
    sidfieldname: 'sid', // data inside of your database
    knex: dbKnex, // asks knex if we already have this file
    createtable: true, // creates this table if it does not exist
    clearInterval: 1000 * 60 * 60 // clears sessions every hour from the db
  })
}

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig)); // pass an object as the arg

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

function protected(req, res, next) {
  // if a session exists AND the user is logged in... next
  // else bounce the user
  if (req.session && req.session.userId) {
    next()
  } else {
    res.status(401).json({ message: 'you shall not pass, not authenticated' })
  }
}

// protect this endpoint so only logged in users can see it
server.get('/users', protected, (req, res) => {
  db.getAllUsers()
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
      /* notes...
        console.log('body user', creds); // client password
        console.log('body user', bcrypt.hashSync(creds.password)); // notice different hash key gets created than what is stored in the db... to check hash is same for same password... use bcrypt.compareSync(clientPassword, dbHash)
        console.log('database user', users[0]); // database hash password
      */
      // gets an array with a username and password...
      // and the hash matches between the db and the client
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        req.session.userId = user.id;
        // another option...
        // req.session.user = user;

        res.json({ message: `welcome ${user.name}` })
      } else {
        res.status(401).json({ you: "shall not pass!!" })
      }
    })
    .catch(err => res.status(500).send(err));
})

server.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).send('you can never leave');
      } else {
        res.status(200).send('bye bye')
      }
    })
  } else {
    res.json({ message: 'logged out already' })
  }
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