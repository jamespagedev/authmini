exports.up = function (knex) {
  return knex.schema.createTable('users', users => {
    // Primary Key 'id'
    users.increments();

    // Other Columns (username and password)
    users
      .string('username', 255)
      .notNullable()
      .unique();

    users.string('name', 255).notNullable();

    users.string('password', 255).notNullable();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
