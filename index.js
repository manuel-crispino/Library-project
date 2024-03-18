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

let bookTitleArray = [
    {
        title: "poor dad"
    }
];
let bookId = [];

let currentIndex = 0;
let value;
let bookTitle;

function resetArray() {
    bookId = [];

}

async function getCover() {
    value = bookId[currentIndex];
    try {
        const imgUrl = await Promise.all(value.map(async(key) => {

            const img = await axios.get(`https://covers.openlibrary.org/b/olid/${key}-M.jpg`);

            return img.config.url;
        }));
        console.log(imgUrl);
        return imgUrl;

    } catch (err) {
        console.log(err)
    }
}

async function getTitle() {

    const limit = 3;
    try {
       let ratings=[];
        for (currentIndex; currentIndex < limit; currentIndex++) {
         
            bookTitle = bookTitleArray[currentIndex].title;
            const result = await axios.get('https://openlibrary.org/search.json?title=' + bookTitle + '&limit=' + limit);
           const books = result.data.docs;
            const keyValue = books.map(book => book.cover_edition_key);
            bookId.push(keyValue);
          const  ratingsValue= books.map((book)=>Math.floor(book.ratings_average))
        ratings.push(ratingsValue);
         return {books,ratings};
    }
    } catch (err) {
        console.log(err);
        return err;
    }
}

app.get("/", async(req, res) => {
    try {
        const {books,ratings} = await getTitle();
        const imgUrl = await getCover();
        const extractedRatings = ratings[0]; 
        console.log(extractedRatings)
        res.render('index', {
            books: books,
            cover: imgUrl,
            ratings:extractedRatings,
            err: null
        });
        resetArray();
    } catch (err) {
        console.log(err)
        res.render("index", {
            err: err,
            books: null,
            ratings:null,
            cover: null
        });
    }
});

app.post("/search", async(req, res) => {
    const title = req.body.bookTitle;
    const limit = 5;
    try {
        const result = await axios.get('https://openlibrary.org/search.json?title=' + title + '&limit=' + limit);
        const books = result.data.docs;
        value = books.map(book => book.cover_edition_key);
        const img = await axios.get(`https://covers.openlibrary.org/b/${key}/${coverKey}-${size}.jpg`);
        const imgUrl = img.config.url;

        if (books.length > 0 && imgUrl.length > 0) {

            console.log(imgUrl);
            res.render("index", {
                books: books,
                cover: value,
                err: null
            });
        } else {
            const err = new Error();
            res.render("index", {
                books: null,
                cover: null,
                err: err
            })
        }
    } catch (err) {
        console.log(err.message)
        res.render("index", {
            books: null,
            cover: null,
            err: err
        });
    }
});

app.listen(port, () => {
    console.log(`app listen on port ${port}`);

})