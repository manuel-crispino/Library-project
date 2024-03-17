import express from "express";
import bodyParser from "body-parser";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import pg from "pg";
import axios from "axios";
import fs from "fs";

const port = 3000;

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));

let bookTitle = [
    {
        title: "poor dad"
    }
];
let bookId = [
    {
        key: "olid",
        value: "OL26632040M",
        size: "M",
    }
];

async function getCover(coverKey) {
    const {key, value, size} = bookId[0];

    try {
        const img = await axios.get(`https://covers.openlibrary.org/b/${key}/${value}-${size}.jpg`);
        const imgUrl = img.config.url;
        return imgUrl;
    } catch (err) {
        console.log(err);
    }
}

async function getTitle() {

    const titleArray = bookTitle[0].title;
    const limit = 1;
    try {
                const result = await axios.get('https://openlibrary.org/search.json?title=' + titleArray + '&limit=' + limit);
                const books = result.data.docs;
                return books;
          
     
    } catch (err) {
        console.log(err);
        return err;
    }

}

app.get("/", async(req, res) => {
    try {
      
        const imgUrl = await getCover();
        const books = await getTitle();

        res.render('index', {
            books: books,
            cover: imgUrl,
            err: null,
        });
    } catch (err) {
        console.log(err)
        res.render("index", {
            err: err,
            books: null,
            cover: null
        });
    }
});

app.post("/search",async(req,res)=>{
    const title = req.body.bookTitle;
    const limit = 1;
    try{
const result = await axios.get('https://openlibrary.org/search.json?title=' + title + '&limit=' + limit);
const books = result.data.docs;
const coverKey=books.map(book => book.edition_key[0])
const key= "olid";
const size="M";
const img = await axios.get(`https://covers.openlibrary.org/b/${key}/${coverKey}-${size}.jpg`);
const imgUrl = img.config.url;

if(books.length > 0 && imgUrl.length > 0){
console.log(imgUrl);
res.render("index",{
    books:books,
    cover:imgUrl,
    err:null,

});
}
else{
    const err = new Error("No book found with this title = "+ title);
   res.render("index",{
    books:null,
    cover:null,
    err:err,
   })
}
}
    catch(err){
console.log(err.message)
res.render("index",{
    books:null,
    cover:null,
    err:err,
});
    }
});

app.listen(port, () => {
    console.log(`app listen on port ${port}`);

})