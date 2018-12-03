// Installs required: node-spotify-api, axios, moment, play-sound, dotenv
// optional audio playback requires installed command-line playback program such as: afplay | aplay | cmdmp3 | mpg123 | mpg321 | mplayer | omxplayer | play
// see https://www.npmjs.com/package/play-sound for more details.

const keys = require('./keys.js'); // loads secret keys.
const COMMAND_LIST = 'spotify-this-song songname to look up a song\nplay-this-song songname to search and play a song\nmovie-this moviename to search for a movie\nconcert-this bandname to search for concerts\n';
const COMMAND_FILE = 'random.txt';
const LOG_FILE = 'log.txt';
const SEPARATOR = '---------------------------';
let queryType, queryText;

if (process.argv[2]) { // Convert command-line arguments to variables:
	queryType = process.argv[2].toLowerCase(); // first user argument is the command
}
if (process.argv[3]) {
	queryText = process.argv.splice(3).join(' '); // second and subsequent user arguments are the search term
}
processUserCommand();

function processUserCommand() {
	switch (queryType) {
		case 'spotify-this-song':
			searchSpotify(queryText);
			break;
		case 'play-this-song':
			searchSpotify(queryText, true);
			break;
		case 'movie-this':
			searchOMDB(queryText);
			break;
		case 'concert-this':
			searchBands(queryText);
			break;
		case 'do-what-it-says':
			readCommandFromFile(COMMAND_FILE);
			break;
		default:
			console.error('You must specify a valid command.');
			console.error(COMMAND_LIST);
	}
}

function readCommandFromFile(commandFileName) {
	const fs = require('fs');
	if (fs.existsSync(commandFileName)) {
		let fileContents 
		try {
			fileContents = fs.readFileSync(commandFileName, 'utf8');
		}
		catch (fileReadError) {
			console.error('Error reading file, aborting.');
			return
		}
		// now parse the contents of the file:
		const command = fileContents.split(',');
		queryType = command[0]; // No error checks here besides the recursive check.
		// The processUserCommand() function already handles errors and missing arguments.
		if (queryType === 'do-what-it-says') {
			console.error('Cannot call function do-what-it-says from random.txt, it would result in an endless loop.');
			return
		}
		queryText = command[1].replace('"', '');
		processUserCommand();
	}
	else {
		console.error('Could not open file', commandFileName, ', aborting.');
	}
}

async function searchOMDB(movieName = 'Mr. Nobody') {
	logToFile(`> movie-this ${movieName}`);
	movieName = movieName.replace(/ /g, '+');
	const movieSearchURL = `http://www.omdbapi.com/?apikey=${keys.omdb.key}&t=${movieName}`;
	let movieData = null;
	try {
		movieData = await axiosRequest(movieSearchURL);
	} 
	catch (omdbError) {
		console.error(omdbError);
		return
	}
	try {
		logData(`Title: ${movieData.Title}`);
		logData(`Release Year: ${movieData.Year}`);
		logData(`IMDB Rating: ${movieData.Ratings[0].Value}`);
		logData(`Rotten Tomatoes Rating: ${movieData.Ratings[1].Value}`);
		logData(`Country: ${movieData.Country}`);
		logData(`Language: ${movieData.Language}`);
		logData(`Plot: ${movieData.Plot}`);
		logData(`Actors: ${movieData.Actors}`);
	}
	catch (missingDataError) {
		console.log('Note: Some data was not available for your search query.');
	}
	logToFile(SEPARATOR);
}

async function searchBands(bandName = 'Los Lonely Boys') {
	logToFile(`> concert-this ${bandName}`);
	const moment = require('moment');
	const bandSearchURL = `https://rest.bandsintown.com/artists/${bandName}/events?app_id=codingbootcamp`;
	const bandData = await axiosRequest(bandSearchURL);
	if (bandData[0] === undefined) {
		logData(`No upcoming shows for artist ${bandName} found.`);
		return
	}
	else {
		try {
			logData('Upcoming concerts:');
			bandData.forEach( (concert) => {
				logData(`Venue Name: ${concert.venue.name}`);
				logData(`Location: ${concert.venue.city}, ${concert.venue.region}`);
				const date = moment(concert.datetime).format('MMMM Do YY, h:mm a');
				logData(`Date: ${date}`);
				logData(SEPARATOR);
			});
		}
		catch (bandSearchError) {
			console.error(`Error displayig information for this band: ${bandSearchError}`);
		}
	}
}

async function axiosRequest(requestURL) {
	const axios = require('axios');
	let response;
	try {
		response = await axios(requestURL);
	}
	catch (err) {
		console.error('Error with OMDB query:', err);
	}
	return await response.data;
}

async function searchSpotify(songName = 'The Sign Ace of Base', playSong = false) {
	logToFile(`> spotify-this-song ${songName}`);
	const Spotify = require('node-spotify-api');
	const spotify = new Spotify({ id: keys.spotify.id, secret: keys.spotify.secret });
	let spotifyResponse;
	try {
		spotifyResponse = await spotify.search({ type: 'track,artist', query: songName });
	}
	catch (spotifyError) {
		console.error(spotifyError);
		return
	}
	const track = spotifyResponse.tracks.items[0];
	const title = track.name;
	let artists = '';
	track.album.artists.forEach( (artist) => {
		artists += artist.name + ' ';
	});
	const artist = track.album.artists[0].name; // used for file downloads
	const previewURL = track.preview_url;
	logData(`Title: ${title}`);
	logData(`Artist(s): ${artists}`);
	logData(`Album: ${track.album.name}`);
	logData(`Preview URL: ${previewURL}`);
	logToFile(SEPARATOR);
	if (playSong) {
		downloadThenPlaySong(previewURL, artist, title);
	}
}

function playSong(fileName) {
	const fs = require('fs');
	if (fs.existsSync(fileName)) {
		const player = require('play-sound')(opts = {});
		console.log(` ♯ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫ ø`);
		player.play(fileName, function(playError) {
			if (playError) {
				console.error("Skipping audio playback, no suitable playback program found:");
			}
		});
	}
	else {
		console.error('Could not locate file', fileName, 'so attempt to play music was aborted.');
	}
}

async function downloadThenPlaySong(songURL, songArtist, songTitle) {
	// attempts to download a song preview from Spotify and then play it.
	const songFileName = songArtist.toLowerCase().replace(/ /g, '_') + '-' + songTitle.toLowerCase().replace(/ /g, '_'); // todo: replace more special characters
	const songFilePath = 'songs/' + songFileName + '.mp3';
	const fs = require('fs');
	if (fs.existsSync(songFilePath)) { // mp3 file already exists, skipping download
		playSong(songFilePath);	
	}
	else { // we need to download the mp3 preview
		const file = fs.createWriteStream(songFilePath);
		const https = require('https');
		https.get(songURL, (response) => {
			response.on('data', (data) => {
				file.write(data); // write all data to file
			});
			response.on('end', () => { // ...until we reach the end of the stream, then launch the playback function
				playSong(songFilePath);	
			});
		}).on('error', (mp3DownloadError) => {
			console.error(mp3DownloadError);
		});
	}
}

function logData(stringToLog) {
	// Replaces console.log to allow all logging to be try/catched
	// And also calls logToFile function which duplicates output to log file.
	try {
		console.log(stringToLog);
	}
	catch (consoleLogError) {
		console.error('Error logging data:', consoleLogError);
	}
	logToFile(stringToLog);
}

function logToFile(stringToLog) {
	// Appends log file to include stringToLog
	const fs = require('fs');
	try {
		fs.appendFileSync(LOG_FILE, stringToLog + '\n');
	}
	catch (logFileError) {
		console.error('Unable to log data to file:', logFileError);
	}
}