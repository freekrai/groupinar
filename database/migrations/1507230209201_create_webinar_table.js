'use strict'

const Schema = use('Schema')

class WebinarsTableSchema extends Schema {

  up () {
    this.create('webinars', (table) => {
      table.increments()
	  table.integer('user_id').unsigned().references('id').inTable('users')
	  table.text('meta')
      table.timestamps()
    })
  }

  down () {
    this.drop('webinars')
  }

}

module.exports = WebinarsTableSchema
