const {
  PORT = 3001,
  MONGODB_URI = 'mongodb://127.0.0.1:27017/meditrack',
  JWT_SECRET = 'dev-secret',
  NODE_ENV = 'development',
} = process.env;

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
};
