//console.log('Keys are loaded.');
require("dotenv").config();
// process.env object holds all environmental variables, including the ones we've added in our .env file (hidden)
exports.spotify = {
  id: process.env.SPOTIFY_ID,
  secret: process.env.SPOTIFY_SECRET
};
