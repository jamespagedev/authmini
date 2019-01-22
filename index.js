const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database/dbConfig.js');


const server = express();

server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send('Its Alive!');
});

server.post('/api/register', (req, res) => {
  const user = req.body;
  user.password = bcrypt.hashSync(user.password, 14); // overwrite password as soon as possible with the hash algorithm, 14 adds complexity to the hash algorithm (14 is a good baseline, go higher if needed... will require more log in time)
  db('users')
    .insert(user)
    .then(id => {
      res.status(201).json({ id: id[0] });
    })
    .catch(err => {
      res.status(500).send(err);
    })
})

server.post('/api/login', (req, res) => {
  // Precondition - Username must be unique
  // check that username exists AND that passwords match
  const bodyUser = req.body;

  db('users')
    .where('username', bodyUser.username)
    .then(users => {
      /* notes...
        console.log('body user', bodyUser); // client password
        console.log('body user', bcrypt.hashSync(bodyUser.password)); // notice different hash key gets created than what is stored in the db... to check hash is same for same password... use bcrypt.compareSync(clientPassword, dbHash)
        console.log('database user', users[0]); // database hash password
      */
      // gets an array with a username and password...
      // and the hash matches between the db and the client
      if (users.length && bcrypt.compareSync(bodyUser.password, users[0].password)) {
        res.json({ info: "correct" })
      } else {
        res.status(404).json({ err: "invalid username or password" })
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

server.listen(3300, () => console.log('\nrunning on port 3300\n'));
