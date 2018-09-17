const assert = require('assert')
const http = require("https")
process.argv[2] = '--post'
process.argv[3] = 30
const logJSON = require('../hackernews.js')

describe('hackernews', function () {
  it('is hackernews alive', function () {
    http.get('https://news.ycombinator.com/news?', function (res) {
      assert.equal(200, res.statusCode);
    });
  });

  it('should be true if scrapping fetches desired data from those pages', (done) => {
    try {
        logJSON().then((response) => {
          assert.equal(30, response);
          done();
        }); 
    } catch (err) {
    }
  });
})