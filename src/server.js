import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname,'/build')));

app.use(bodyParser.json());

//this is the "fake" database
const articlesInfo = {
    'vue-js' : {
        upvotes: 0,
        comments: [],
    },
    'react' : {
        upvotes: 0,
        comments: [],
    },
    'javascript' : {
        upvotes: 0,
        comments: [],
    },
}


//DB functions and operations
const withDB = async (operations, res) => {

    try {
        
        //mongodb connection
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');

        //wraped operations from features here
        await operations(db);

        client.close();

    } catch(error) {
        res.status(500).json({ message : 'Error connecting db: ', error});
    }      

}

//Get articles by name Feature
app.get('/api/articles/:name', async (req, res) => {

    //wraping operations inside the withDB function
    withDB( async (db) => {

        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articleInfo);

    }, res /*response for the catch*/);
    


})

//UPVOTES FEATURE
app.post('/api/articles/:name/upvote', async (req, res) => {


        //wraping operations inside the withDB function
        withDB( async (db) => {
        
            const articleName = req.params.name;
            
            //Query
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            await db.collection('articles').updateOne({ name: articleName }, {'$set' : { upvotes: articleInfo.upvotes + 1, } });
            const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

            res.status(200).json(updatedArticleInfo);

        }, res /*response for the catch*/);        

    //used for the "fake" database before use mongodb
   // articlesInfo[articleName].upvotes += 1;
   // res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`)    
});

app.post('/api/articles/:name/add-comment', (req, res) =>{

    withDB( async (db) =>{

    //Query
    const { username, text } = req.body;
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, 
        { '$set' : { 
            comments: articleInfo.comments.concat({  username, text  })
        } 
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
    

    //articlesInfo[articleName].comments.push({ username, text });

    //res.status(200).send(articlesInfo[articleName]);

    }, res /*response for the catch*/); 
}
);

app.get('/hello', (req, res) => res.send('Hello!'));

app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));

app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}`));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on 8000'));

