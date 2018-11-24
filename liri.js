// installs required: node-spotify-api, audio-play, audio-load

const keys = require('./keys.js'); // loads secret keys.
const user = { command: null, text: null, songURL: null} // user command will be entered in this object.
let Spotify, spotify; // Spotify variables, only initialized if command is a Spotify search.

convertArgumentsToCommand();
if (!user.command) {
	console.error('You must supply arguments...');
	console.error('search-this-song songname to look up a song');
	return;
}
else {
	console.log('Command is', user.command);
}

// Determine what the command is:
if (user.command == 'search-this-song') {
	if (user.text == null) {
		console.error('You must specify a song name.');
		return;
	}
	console.log(`Search spotify for song ${user.text}`);
	searchSpotifyForSong(user.text);
	// This does not work, it returns before it has the response.
	//let songObject = searchSpotifyForSong(user.text);
	//console.log(songObject);
}

function playSong(fileName) {
	var fs = require('fs');
	if (fs.existsSync(fileName)) {
		const load = require('audio-loader');
		const play = require('audio-play');
		load(fileName).then(play);
	}
	else {
		console.error('Could not locate file', fileName);
	}
}

function searchSpotifyForSong(songName) { // default to The Sign by Ace of Base
	if (songName == null) {
		songName = 'The Sign';
	}
	initializeSpotify();
	spotify.search({ type: 'track', query: songName }, function(err, data) {
		if (err) {
		return console.log('Error occurred: ' + err);
		}
		//console.dir(data);
		console.dir(data.tracks.items[0]);
		//return data.tracks.items[0];
		console.log(data.tracks.items[0].preview_url);
		user.songURL = data.tracks.items[0].preview_url;
		// ok, let's try to play it then:
		const fs = require('fs');
		const file = fs.createWriteStream('song.mp3');
		const https = require('https');
		https.get(user.songURL, (res) => {
			res.on('data', (d) => {
				file.write(d);
			});
			res.on('end', () => {
				console.log('download finished, play song now');
				//setTimeout(playSong(file), 3000);
				sleep(1000).then(playSong('song.mp3'));

			});
		}).on('error', (e) => {
			console.error(e);
		});

	});
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

function initializeSpotify() {
	// Only initialize spotify if we're doing a spotify search:
	Spotify = require('node-spotify-api');
	spotify = new Spotify({
		id: keys.spotify.id,
		secret: keys.spotify.secret
	});
}

function convertArgumentsToCommand() {
	if (process.argv[2]) {
		user.command = process.argv[2].toLowerCase();
	}
	if (process.argv[3]) {
		user.text = process.argv.splice(3).join(' ');
	}
	return user;
}