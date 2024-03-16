import express from "express";
import bodyParser from "body-parser";
import {dirname,join} from "path";
import {fileURLToPath} from "url";
import pg from "pg";
import axios from "axios";
import fs from "fs";

const port=3000;

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.set('view engine','ejs');
app.set('views', join(__dirname,'views'));

app.use(express.static(join(__dirname,'public')));
app.use(express.urlencoded({extended: true}));

let bookTitle =[ {title:"poor dad"}];
let bookId=[{key:"olid",value: "OL26632040M",size:"M"}];


const body = document.querySelector(`body`);

const key = 'olid';
const value = 'OL26632040M';
const size = 'M';

async function fetchImage(url) {
  const img = new Image();
  return new Promise((res, rej) => {
    img.onload = () => res(img);
    img.onerror = e => rej(e);
    img.src = url;
  });
}

const img = await fetchImage(
  `https://covers.openlibrary.org/b/${key}/${value}-${size}.jpg?default=false`
);
img.width = '200';

document.body.appendChild(img);



app.get("/",async(req,res)=>{
   try {
    const title= bookTitle[0].title;
   const limit=5;
   const img = await fetchImage(`https://covers.openlibrary.org/b/${key}/${value}-${size}.jpg`);
   const w = img.width=200;
const result = await axios.get('https://openlibrary.org/search.json?title='+title+'&limit='+limit);
const books=result.data.docs;
console.log(url)
    res.render('index',{
        books:books,
       cover:img,
    });
} catch(err){
        console.log(err)
    }
});


app.listen(port,()=>{
    console.log(`app listen on port ${port}`);
 
})