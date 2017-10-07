'use strict'

const Schema = use('Schema')

class WebinarsTableSchema extends Schema {

  up () {
    this.create('webinars', (table) => {
      table.increments()
	  table.integer('user_id').unsigned().references('id').inTable('users')
	  table.string('title', 254).notNullable()
	  table.string('slug', 254).notNullable().unique()
	  table.text('description')
	  table.string('summary', 254)
	  table.integer('is_public').unsigned().default(0);
	  table.integer('has_password').unsigned().default(0);
	  table.string('password', 60)
	  table.text('meta')
      table.timestamps()
    })
  }

  down () {
    this.drop('webinars')
  }

}

module.exports = WebinarsTableSchema
