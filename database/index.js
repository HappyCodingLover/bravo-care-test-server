const dotenv = require('dotenv')
const { Sequelize } = require('sequelize')
dotenv.config()

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
  }
)

module.exports = { sequelize }
