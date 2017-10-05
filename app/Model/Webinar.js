'use strict'

const Lucid = use('Lucid')

class Webinar extends Lucid {
	user() {
        return this.belongsTo('App/Model/User')
    }

}

module.exports = Webinar
