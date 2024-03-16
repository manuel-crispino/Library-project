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





app.get("/",async(req,res)=>{
   try {
    const title= bookTitle[0].title;
   const limit=1;
  const {key,value,size}=bookId[0];
   const img = await axios.get(`https://covers.openlibrary.org/b/${key}/${value}-${size}.jpg`);
   const result = await axios.get('https://openlibrary.org/search.json?title='+title+'&limit='+limit);
const imgUrl=img.config.url;
const books=result.data.docs;
console.log(img.config.url)
    res.render('index',{
        books:books,
       cover:imgUrl,
    });
} catch(err){
        console.log(err)
    }
});


app.listen(port,()=>{
    console.log(`app listen on port ${port}`);
 
})