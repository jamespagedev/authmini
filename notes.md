Login Creds:

```
{
    "username": "kai",
    "password": "pass"
}
```

dependencies

- express
- helmet
- nodemon --dev
- knex and sqlite3
- bcryptjs
- express-session
- connect-session-knex
- jsonwebtoken
- dotenv

client > orders (decide cascade strategy)

.onUpdate('CASCADE')
.onDelete('RESTRICT')

workflow

- use logs in
- server provides a cookie
- subsequent requests the client sends the cookie
- server checks the cookie and provides/denies access

OAuth2: authorization network.
Open ID Connect: authentication protocol.

Tokens:

- authentication/id token. who are you?
- access/authorization token. what can you do?
- refresh token.

Working with JWTs (JSON Web Tokens)

Server Responsibilities

- check out jwt.io/#debuggers
- producing the token
- sending the token to the client
- reading the token from the request
- verifying the token is valid
- providing data (payload) from the token to the rest of the application

Client's Responsibilities
- store the token and hold on to it
- send token on every request
- on logout, destroy the token

users *---* roles
roles *---* permissions
users *---* groups

in OAuth2, permissions are called scopes ('read:salary', 'edit:salary')