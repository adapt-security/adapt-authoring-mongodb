# Using MongoDB
The `adapt-authoring-mongodb` module adds the ability to work with MongoDB databases.

## Installing MongoDB
To save data with the authoring tool, you'll need either a local MongoDB install, or a hosted solution.

If you're new to hosting web applications/MongoDB and are intending to make your install accessible via the internet, we'd suggest going with a hosted solution.

For instructions on installing MongoDB, see the [MongoDB docs](https://docs.mongodb.com/manual/installation/#mongodb-community-edition-installation-tutorials).

## Using the module
The `adapt-authoring-mongodb` module uses MongoDB's [Node.js driver](https://mongodb.github.io/node-mongodb-native/4.2) behind-the-scenes for communicating with MongoDB.

Where possible, the MongoDBModule API has been designed to mirror the MongoDB Node.js driver API in both naming convensions and parameter naming/order. In some cases this has been changed for ease-of-use (e.g. `insertOne` has been renamed to `insert`). Please see the [Adapt authoring reference for the MongoDBModule](/class/node_modules/adapt-authoring-mongodb/lib/MongoDBModule.js~MongoDBModule.html) for more information (details on which of the MongoDB Node.js driver functions are used is specified there).

_If you're new to working with MongoDB, check out this [Quick Start](https://mongodb.github.io/node-mongodb-native/4.2/#quick-start) guide in the official docs for a good overview._

### Basic use
The following functions provide the most common functionality, and will likely be the functions you use most often. Please see the [API reference]([/class/node_modules/adapt-authoring-mongodb/lib/MongoDBModule.js~MongoDBModule.html](https://tomtaylor.codes/ls/jsdoc3/MongoDBModule.html)) for full details.

#### `find(collectionName, query, options)`
Retrieves a document.

#### `insert(collectionName, data, options)`
Inserts a new document.

#### `replace(collectionName, query, data, options)`
Completely replaces an existing document.

#### `update(collectionName, query, data, options)`
Updates only specific fields of an existing document.

#### `delete(collectionName, query, options)`
Removes an existing document.

### Querying the database
The `find` function is used to retrieve documents from the database.


#### Examples
Note that the MongoDB module, as with the rest of the application, makes heavy use of promises, and will return a pending Promise for all relevant functions.

Inserting a document into the 'test' collection:
```
try {
  const data = await mongodb.insert('test', { hello: 'world' });
} catch(e) {
  // handle error
}
```

### Advanced use
It is possible to access the Node.js driver API directly from the MongoDBModule instance to allow for extra functionality not covered by the MongoDBModule itself. An example of this being creating an aggregation pipeline.

There are two methods of accessing the driver API. Which one you use is entirely up to you, and mostly comes down to code brevity:
- Using the MongoDB client instance [[Adapt docs](https://tomtaylor.codes/ls/jsdoc3/MongoDBModule.html#client), [MongoDB Node.js driver docs](https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html)]
- Using the MongoDB collection [[Adapt docs](), [MongoDB Node.js driver docs](https://tomtaylor.codes/ls/jsdoc3/MongoDBModule.html#getCollection)]

```
// using the client instance
mongodb.client.db.collection('mycollection').aggregate(/* args */)
// using MongoDBModule#getCollection
mongodb.getCollection('mycollection').aggregate(/* args */)
```

See the [MongoDB Node.js driver docs](https://mongodb.github.io/node-mongodb-native/4.2/classes/Collection.html) for the full API.