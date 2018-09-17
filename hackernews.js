const axios = require('axios');
const cheerio = require('cheerio');
const api_url = 'https://news.ycombinator.com/news?';

let noOfArticles = 0;


//Checks for no.of.articles and the range >0 <=100 
if (process.argv[3] && process.argv[3] > 0 && process.argv[3] <= 100 && process.argv[2] == '--post') {
    noOfArticles = Number(process.argv[3]);
    console.log("SCRAPPING!!!!!!!!!! ")
} else {
    console.log('use following cmd to run --> node hackernews --post 44')
    console.log("Number of articles should be >0 and <= 100")
    process.exit();
}

//Decides no.of.pages to be scrapped
const pagination = Math.ceil(noOfArticles / 30)

const utils = {
    validURI: (uri)=>{
            let regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            return regexp.test(uri);    
    },
    strLength:(str)=> str.length <= 256
}

const logJSON = async () => {
    try {
        let axiosAll = [];
        for (let i = 0; i < pagination; i++) {
            //Returns promises each page
            axiosAll.push(await axios.get(`${api_url}p=${i+1}`))
        }

        return axios.all(axiosAll)
            .then(axios.spread((...args) => {
                let itemListText = '';
                //Concatenating all scrapped page to a single file
                for (let page in args) {
                    let $ = cheerio.load(args[page].data)
                    itemListText += $('.itemlist').html();
                }
                return itemListText
            })).then((itemListText) => {
                //HTML Parsing of concatenated 
                let tempHTML = '<div id="itemlist" class="items"></div>';
                let $ = cheerio.load(tempHTML)
                $(itemListText).appendTo('#itemlist')
                return $
            }).then(($) => {
                let titleArr = [],
                    articleDesc = [],
                    hackerNews = [];
                //Since data should be scrapped from two different div's, seperate loops are used 
                //Scraps Title, URI
                $('.items tr.athing').each(function (i, elem) {
                    let obj = {
                        "title": $(elem).find('.storylink').text(),
                        "uri": decodeURIComponent($(elem).find('.storylink').attr('href')),
                        "rank":Number($(elem).find('.rank').text() &&
                        $(elem).find('.rank').text().replace('.','').trim())
                    }
                    titleArr.push(obj)
                });

                //Scraps Points, Author
                $('.items tr .subtext').each(function (i, elem) {
                    let obj = {
                        "author": $(elem).find('.hnuser').text(),
                        "points": Number($(elem).find('.score').text() && 
                                    $(elem).find('.score').text().replace('points','').replace('point','').trim()),
                        "comments": Number($(elem).children().last().text() && 
                        $(elem).children().last().text().replace('comments','').replace('comment','').trim())
                    }
                    articleDesc.push(obj)
                });

                //Filtering data based on all manadatory fields
                articleDesc.forEach((article, i) => {
                   let title = titleArr[i];
                    if (title.title && article.author && i < noOfArticles 
                        && utils.validURI(title.uri) && utils.strLength(title.title) && article.comments) {
                        hackerNews.push(Object.assign(title,article))
                    }   
                });

                //Output JSON
                hackerNews = JSON.stringify(hackerNews, null, 2);
                console.log(hackerNews)
                return titleArr.length;
            })

    } catch (e) {
        console.log("Something Broke!!! Ouch!!!")

    }
}

logJSON();

module.exports = logJSON