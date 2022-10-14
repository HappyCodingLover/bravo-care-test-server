const { DataTypes } = require('sequelize')
const { sequelize } = require('.')

const Facility = sequelize.define('facility', {
  facility_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  facility_name: DataTypes.TEXT,
})

const facility = Facility.build

module.exports = Facility
