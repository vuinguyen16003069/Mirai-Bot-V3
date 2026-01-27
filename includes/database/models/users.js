module.exports = ({ sequelize, Sequelize }) => {
  const Users = sequelize.define('Users', {
    num: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userID: {
      type: Sequelize.BIGINT,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    gender: {
      type: Sequelize.STRING,
    },
    data: {
      type: Sequelize.JSON,
    },
  })

  return Users
}
