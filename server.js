const express = require("express");

const {fetcher} = require('./fetcher.js');

/*
    TODO: краулер страницы
    POST http://localhost:3000/parse
    body: { domainName: string}
    return string[]
*/

const app = express();
app.use(express.json());

const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello!');
})

const extractLinks = (htmlString) => {
  const regex = /(?:href|src)="([^"]+)"/g;
  const matches = [];
  let match;

  while (match = regex.exec(htmlString)) {
    matches.push(match[1]);
  }

  return matches
}

const getUnique = (urls, results) => {
  return urls.filter((url) => !results.has(url))
}

app.post('/parse', async (req, res) => {
  let results = new Set();
  let fetched;

  const data = req.body;
  const {domainName} = data;

  try {
    fetched = await fetcher(domainName)
    if (fetched.status !== 200) {
      return;
    }
  } catch (e) {
    return res.send(e.message);
  }

  const text = await fetched.text();
  const linksToCheck = extractLinks(text);

  while (linksToCheck.length > 0) {
    const url = linksToCheck.pop()
    if (results.has(url)) {
      continue;
    }

    try {
      const fetched = await fetcher(url);

      if (fetched.status === 200) {
        results.add(url)

        try {
          const text = await fetched.text();
          const urls = extractLinks(text)
          linksToCheck.push(...getUnique(urls, results))
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  res.send([...results]);
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
})



