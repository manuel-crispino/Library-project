import express from "express";
import bodyParser from "body-parser";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import pg from "pg";
import axios from "axios";


const port = 3000;

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));

//MAKE SURE YOU HAVE THE SAME VALUES OR EDIT WITH THE NEW VALUES AS NEEDED //

const db=new pg.Client({
    user: "postgres",
    host: "localhost",
   database:"library",
   port:5432,
   password:"",// add your database password here !//

});

db.connect()
   .then(() => console.log('Connected to PostgreSQL database'))
   .catch(err => console.error('Connection error', err));

async function getTitle(user){ //this will get the name from the title and turn it into id //
    try{
    const bookTitleQuery= await  db.query("SELECT title_name FROM books WHERE user_id = (SELECT id FROM users WHERE id = $1)",[user]);
    const bookTitle = bookTitleQuery.rows.map((row) => row.title_name );
    if (bookTitle ){
return bookTitle;
}
else{
    console.log("error in getTitle")
}}
catch(err){
    console.log(err.message)
}

}

let userIndex=[];

async function getUser(currentUser,password){
    try{
        if(password==="1234"){  
const result=  await db.query("SELECT id FROM users WHERE LOWER(name) = $1",
    [currentUser.toLowerCase()]);
if(result.rows.length>0){
return result.rows[0].id;
}}
else{
    console.log("error in getUser");
    return null;
   
}
}
catch(err){
console.log(err.message)

}};

app.get("/",async(req,res)=>{

 res.render("welcome");
})

app.post("/add-user",async(req,res)=>{
    userIndex=[];
  const  currentUser= req.body.userName;
  const  password= req.body.userPassword;
  const checkAccess= await getUser(currentUser,password);
  console.log(currentUser,password)
    try{
        if(checkAccess){
userIndex.push(currentUser,password)
   res.redirect("/home")
} else {
    console.log("password or user name  not found access denied ")
   const  accessDenied= new Error()
    res.render("welcome",{
        currentUser:null,
        accessDenied:accessDenied,
         err:null
        })
} ;
}catch(err){
    console.log(err.message)
    res.status(404)
}
});



app.get("/home",async(req,res)=>{
    const limit=1;
   const currentUser= userIndex[0];
   const password= userIndex[1];
const user= await getUser(currentUser,password);
const bookTitle = await  getTitle(user);
    try{
    const title = await Promise.all(bookTitle.map(async(book) => {

        const result = await axios.get('https://openlibrary.org/search.json?title=' + book + '&limit=' + limit);

        return  result.data.docs[0];
    }));
  
res.render("index",{
    userBookIndex:bookTitle,
user:currentUser,
    userId: user,
    books:title,
    err:null
   })
}catch(err){    
    console.log(err.message)
    res.render("index",{
        userBookIndex:null,
        user:null,
    userId: null,
    books:null,
    err:err
    })
}
});

app.get("/your-books",async(req,res)=>{
    const limit=1;
    const currentUser= userIndex[0];
    const password= userIndex[1];
 const user= await getUser(currentUser,password);
 const bookTitle = await  getTitle(user);

    try{
        const title = await Promise.all(bookTitle.map(async(book) => {
    
            const result = await axios.get('https://openlibrary.org/search.json?title=' + book + '&limit=' + limit);
    
            return  result.data.docs[0];
        }));
    res.render("books",{
        userBookIndex:bookTitle,
            user:currentUser,
                userId: user,
                books:title,
                err:null
               })
            }catch(err){    
                console.log(err.message)
                res.render("index",{
                    userBookIndex:null,
                    user:null,
                userId: null,
                books:null,
                err:err
                })
            }})


app.post("/search",async(req,res)=>{
      const limit=10;
      const bookTitle=req.body.bookTitle;
      const currentUser= userIndex[0];
      const password= userIndex[1];
      const user= await getUser(currentUser,password);
      const booksIndex = await  getTitle(user);
try{
    const result = await axios.get('https://openlibrary.org/search.json?title=' + bookTitle + '&limit=' + limit);
   const  books= result.data.docs;
   const title=books.map((book)=>book);

   res.render("index",{
    userBookIndex:booksIndex,
    user:currentUser,
                userId: user,
    books:title,
    err:null
   })
  
}catch(err){
    res.render("index",{
        userBookIndex:null,
        user:null,
                    userId: null,
        books:null,
        err:err
       })
}
});




app.post("/add-book",async(req,res)=>{
    const limit=10;
const bookTitle= req.body.addBook;
const bookCover= req.body.addBookCover;
const currentUser= userIndex[0];
const password= userIndex[1];
const user= await getUser(currentUser,password);

  try{
    await db.query("INSERT  INTO books(user_id, title_name , cover_key) VALUES ((SELECT id FROM users WHERE id = $1), $2,$3)",
[user,bookTitle,bookCover]
);
const booksIndex = await  getTitle(user);
 const result = await axios.get('https://openlibrary.org/search.json?title=' + bookTitle+ '&limit=' + limit);
    const  books= result.data.docs;
  const title=books.map((book)=>book);

res.render("index",{
    userBookIndex:booksIndex,
    user:currentUser,
    userId: user,
        books:title,
        err:null
    });

} catch(err)
{
console.log(err)
res.render("index",{
    userBookIndex:null,
    user:null,
    userId: null,
    books:null,
    err:err
}); 
}
});

app.post("/delete-book",async (req,res)=>{

    const bookTitleDelete= req.body.addBook;
    const bookCover= req.body.addBookCover;
    const currentUser= userIndex[0];
    const password= userIndex[1];
    const user= await getUser(currentUser,password);

    try {
        const deleteFromDb = await db.query("DELETE FROM books WHERE user_id = (SELECT id FROM users WHERE id = $1) AND title_name = $2 AND cover_key = $3",
            [user, bookTitleDelete, bookCover]);

        res.redirect("/your-books");
    } catch (err) {
        console.error(err);
        res.redirect("/your-books");
    }
});

app.post("/register-user",async(req,res)=>{
    userIndex=[];
  const currentUser  = req.body.newUserName;
  const password  = req.body.newUserPassword;
  try{
  if ( password === "1234"){
   await db.query("INSERT INTO users(name) VALUES($1)",
   [currentUser])
   const checkAccess = await getUser(currentUser,password);
   if(checkAccess){
    userIndex.push(currentUser,password)
    res.redirect("/home")
    } else {
    console.log("password or user name from registration  not found access denied ")
    const  accessDenied= new Error()
    res.render("welcome",{
        currentUser:null,
        accessDenied:accessDenied,
         err:null
        })
    } 
  }
  else {
    console.log("password or user name  not found access denied form registration ")
    const  accessDenied= new Error()
    res.render("welcome",{
        currentUser:null,
        accessDenied:accessDenied,
         err:null
    })
};
}catch(err){
console.log(err.message)
res.status(404)
}

});

app.get("/edit-user-name",async(req,res)=>{
    const user = userIndex[0];
res.render("edit",{
    user:user,
    err:null
})
});

app.get("/edit-user",async(req,res)=>{
    const user = userIndex[0];
res.render("save",{
    user:user,
    err:null
})
});

app.post("/edit-user",async ( req,res)=>{
   const oldName= userIndex[0];
 const   user = req.body.editUser;
 const password= "1234";
const oldId= await getUser(oldName,password)

 console.log(oldName,oldId)
try{
   const updateUser= await db.query( "UPDATE users  SET name = $1 WHERE id = $2",
    [user,oldId]);
    console.log(user,oldId)
    userIndex=[];
    userIndex.push(user,password);
    res.redirect("/home");
}
catch(err){
res.render("edit",{
    err:err
})
}
});

app.post("/delete-user",async ( req,res)=>{
 const user = req.body.deleteUser;
  const password= "1234";

 
 
 try{
    const oldId= await getUser(user,password);

         await db.query(
        "DELETE FROM users WHERE id = $1",
        [oldId]
    );
     console.log(user,oldId)
     userIndex=[];
     res.redirect("/");
 }
 catch(err){
    console.log(err.message)
 res.render("save",{
     err:err
 })
 }
 });


app.listen(port, () => {
    console.log(`app listen on port ${port}`);

})