module.exports = {
  definition: {
    host: {
      type: 'String',
      required: true,
      description: 'Name of the host machine where the Mongo database is running'
    },
    port: {
      type: 'Number',
      required: true,
      description: 'Port where the Mongo database is listening'
    },
    dbname: {
      type: "String",
      required: true,
      description: 'Name of the Mongo database to connect to'
    }
  }
};
