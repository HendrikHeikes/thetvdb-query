const api = require("./api");
const fs = require("./fs-io");

const authToken = fs.getToken();

if (!authToken) {
  console.error(
    "No authToken found. Please login to thetvdb first by running npm run login"
  );
  process.exit(1);
}

async function getShow(showName) {
  try {
    const show = await api.search(showName, authToken);
    console.log(`Found show for query "${showName}": "${show.seriesName}"`);

    const cachedShow = fs.read().find(cache => cache.show == show.seriesName);
    if (cachedShow) {
      console.log("=> already in cache");
      return cachedShow;
    } else {
      console.log("=> not in cache, getting episodes");
      const episodes = await api.getEpisodes(show.id, authToken);

      const mappedEpisodes = episodes.map(
        e => `${e.season}x${e.episode} - ${e.aired}: ${e.title}`
      );

      return {
        show: show.seriesName,
        episodes: mappedEpisodes,
        searchTerm: showName
      };
    }
  } catch (e) {
    console.error(`Error while getting Show "${showName}". Error was: ${e}`);
    process.exit(1);
  }
}

async function run() {
  const series = ["Weeds", "House of Cards (US)"];

  const promises = [];
  await series.forEach(async function(serie) {
    promises.push(getShow(serie));
  });

  Promise.all(promises).then((...results) => {
    results.forEach(r => {
      fs.write(r);
    });
  });
}

run();