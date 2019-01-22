dependencies

- express
- helmet
- nodemon --dev
- knex and sqlite3
- bcryptjs
- express-session
- connect-session-knex

client > orders (decide cascade strategy)

.onUpdate('CASCADE')
.onDelete('RESTRICT')

workflow

- use logs in
- server provides a cookie
- subsequent requests the client sends the cookie
- server checks the cookie and provides/denies access