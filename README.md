# liri
LIRI is a _Language_ Interpretation and Recognition Interface. LIRI is a command line node app that takes n parameters and gives you back data.

## What liri does
liri uses 3 APIs to query data and display them in the command line:
Spotify - searches artists and songs
BandsInTown - searches upcoming concerts
OMDB - searches movies

## Installation Steps
1. First, clone the project.

2. npm install
This adds the following libraries:
* node-spotify-api (for requests to the spotify API)
* axios (for HTTP get requests)
* moment (for formatting dates)
* play-sound
* dot-env

3. Create your own spotify key:
https://developer.spotify.com/my-applications/#!/
The spotify key is hidden in environment variables using dot-env. You will need to create a file named .env and enter the following data:
SPOTIFY_ID=your-spotify-id
SPOTIFY_SECRET=your-spotify-secret

4. Optionally, install an audio playback library compatible with the command line, such as:
  afplay | aplay | cmdmp3 | mpg123 | mpg321 | mplayer | omxplayer | play

## Commands:
* node liri spotify-this-song hello (Searches Spotify for song.)
* node liri movie-this the matrix (Searches OMDB for movie information.)
* node liri concert-this foo fighters (Searches BandsInTown for upcoming concerts.)
* node liri do-what-it-says (Reads command from random.txt and executes.)
* node liri play-this-song hello (Downloads and plays Spotify preview of Hello.)

All commands and results are also logged to log.txt
