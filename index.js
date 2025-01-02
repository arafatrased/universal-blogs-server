const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



//Middlewares
app.use(express.json());
app.use(cors());


//Routes



const uri = `mongodb+srv://${process.env.BLOG_USER}:${process.env.BLOG_PASSWORD}@cluster0.7szto.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const blogCollection = client.db('blogsDB').collection('blogs');
    const blogCommentCollection = client.db('blogsDB').collection('comments');

    app.get('/blogs', async (req, res) => {
      const cursor = blogCollection.find({}).sort({ rating: -1 }).limit(6);
      const blogs = await cursor.toArray();
      res.json(blogs);
    });

    app.get('/allblogs', async (req, res) => {
      const searchValue = req.query.search;
      if (searchValue) {
        blogCollection.createIndex({ title: "text" });
        const query = { $text: { $search: searchValue } };
        const cursor = blogCollection.find(query);
        const blogs = await cursor.toArray();
        res.json(blogs);
      } else {
        const cursor = blogCollection.find();
        const blogs = await cursor.toArray();
        res.json(blogs);
      }
    });

    app.get('/recent', async(req, res)=>{
      const cursor = blogCollection.find().sort({ createdAt: -1 }).limit(3);
      const blogs = await cursor.toArray();
      res.json(blogs);
    })


    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const blog = await blogCollection.findOne(query);
      res.json(blog);
    });

    app.get('/blogs/comments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { blog_id: id };
      const cursor = blogCommentCollection.find(query);
      const comments = await cursor.toArray();
      res.json(comments);

    })


    app.post('/blogs', async (req, res) => {
      const newBlog = req.body;
      const result = await blogCollection.insertOne(newBlog);
      res.json(result);
    });

    app.post('/blogs/comments', async (req, res) => {
      const comment = req.body;
      const result = await blogCommentCollection.insertOne(comment);
      res.json(result);
    });

    app.put('/updateblog/:id', async (req, res) => {
      const id = req.params.id;
      const updatedBlog = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          title: updatedBlog.title,
          imageUrl: updatedBlog.imageUrl,
          category: updatedBlog.category,
          shortDescription: updatedBlog.shortDescription,
          longDescription: updatedBlog.longDescription,
        }
      }
      const result = await blogCollection.updateOne(query, update);
      res.json(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Backend is running');
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

