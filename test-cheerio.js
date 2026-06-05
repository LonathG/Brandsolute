const cheerio = require('cheerio');
const html = '<div id="container"><div>A</div><div>B</div></div>';
const $ = cheerio.load(html);
$('#container').empty();
$('#container').append('<div>C</div>');
console.log($.html());
