const clientId = 'fb2f2dbc190d416a9cfd0dc0e989cb3e';
const redirect_uri = 'http://localhost:3000';

let token;

const Spotify = {
  getAccessToken() {
    if (token) {
      return token
    }

    const newToken = window.location.href.match(/access_token=([^&]*)/);
    const newTokenExpires = window.location.href.match(/expires_in=([^&]*)/);
    if (newToken && newTokenExpires) {
      token = newToken[1];
      const expiresIn = Number(newTokenExpires[1]);
      window.setTimeout(() => token = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return token;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&show_dialog=trust&redirect_uri=${redirect_uri}`;
      window.location = accessUrl;
    }
  },

  search(searching) {
    const token = Spotify.getAccessToken();
    const headers = { Authorizations: 'Bearer ${token}' };
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${searching}`, { headers: headers }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Request failed!');
    }, networkError => {
      console.log(networkError.meassage);
    }).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.track.items.map(track => ({ id: track.id, name: track.name, artist: track.artists[0].name, album: track.album.name, uri: track.uri }));
    });
  },

  savePlaylist(playlistName, trackURIs) {
    if (playlistName && trackURIs.length) {
      const accessToken = Spotify.getAccessToken();
      const headers = {
        Authorization: `Bearer ${accessToken}`
      };
      let userID;
      let playlistID;
      return fetch('https://api.spotify.com/v1/me', { headers: headers }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Request failed!');
      }, networkError => {
        console.log(networkError.message);
      }).then(jsonResponse => {
        userID = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ name: playlistName })
        }).then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Request failed!');
        }, networkError => {
          console.log(networkError.message);
        }).then(jsonResponse => {
          playlistID = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ uris: trackURIs })
          }).then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Request failed!');
          }, networkError => {
            console.log(networkError.message);
          }).then(jsonResponse => jsonResponse);
        });
      });
    } else {
      return;
    }
  }
}

export default Spotify;