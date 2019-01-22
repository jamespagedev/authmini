exports.up = function (knex) {
  return knex.schema.createTable('users', users => {
    // Primary Key 'id'
    users.increments();

    // Other Columns (username and password)
    users
      .string('username', 128)
      .notNullable()
      .unique();
    users.string('password', 128).notNullable();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
