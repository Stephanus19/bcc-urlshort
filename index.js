require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//install mongodb npm i mongodb and require it
const { MongoClient } = require('mongodb')
const urlparser =require('url')
const dns = require('dns')

const client = new MongoClient(process.env.MONGO_URI)
const db = client.db("urlshortners")
const urls = db.collection("urls")



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
//middleware to access json abilities
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.post('/api/shorturl', (req,res)=>{
  console.log(req.body)
  const url = req.body.url
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async(err,address)=>{ //urlparser.parse(url).hostname Before checking the domain, the URL provided by the user is parsed to extract its hostname. For example, if the user provides "https://www.google.com/search?q=openai", the urlparser.parse(url).hostname would extract and return "www.google.com" dns.lookup then checks the www.google.com, async(err,address) is the callback that runs after dns lookup is done
    if(!address){
      res.json({error: "invalid url"})
    } else{
      const urlCount = await urls.countDocuments({}) //counting the documents
      const urlDoc = {
        url,
        short_url: urlCount
      }

      const result = await urls.insertOne(urlDoc)
      console.log(result)
      res.json({original_url: url, short_url: urlCount})
      
    }
  })
})

app.get("/api/shorturl/:short_url", async (req,res)=>{
  const shorturl = req.params.short_url //grabbing the :short_url
  const urlDoc = await urls.findOne({short_url: +shorturl}) //findingOne where short_url matches shorturl, the + converts to a number
  res.redirect(urlDoc.url) //redirecting to the url of the urlDoc
})
