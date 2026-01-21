# Using MongoDB
> This guide assumes you have a working MongoDB instance. See the [installation guide](install) for more information.
---

The Adapt authoring tool provides two ways to interact with a MongoDB database:

1. Via functions inherited from **AbstractApiModule** - _recommended for most use cases_
2. Directly via **MongoDBModule**

### Which approach should I use?

Use `AbstractApiModule` when you're building a full-featured API module that manages a collection of documents. It provides various functionality by default, such as schema validation, lifecycle hooks, caching, and automatic REST endpoint generation.

Use `MongoDBModule` directly when you don't need the extra functionality provided by `AbstractApiModule`, need low-level database access, such as aggregation pipelines, bulk operations, or working with collections outside your module's scope.

---

## Using AbstractApiModule

If your module extends `AbstractApiModule`, you get a complete set of database operations with built-in validation and hooks.

### Inserting documents

```javascript
// Validates and inserts a new document. Returns the inserted document.
const doc = await this.insert({ title: 'My Document', status: 'draft' }, { schemaName: 'myresource' })
```

### Querying documents

```javascript
/**
* find()
* Returns an array of documents matching the query (empty if no matches are found)
*/

// Find all
const docs = await this.find()

// Find with query
const drafts = await this.find({ status: 'draft' })

// Find with pagination
const page = await this.find({}, {}, { limit: 10, skip: 20 })


/**
* findOne()
* Returns single document matching the query
* if the strict option is NOT set to false, an error will be thrown if no results are found
*/

const doc = await this.findOne({ _id: '507f1f77bcf86cd799439011' })

// Allow no results (returns undefined instead of throwing)
const doc = await this.findOne({ _id: id }, { strict: false })
```

### Updating documents

```javascript
// Update a single document
const updated = await this.update({ _id: '507f1f77bcf86cd799439011' }, { status: 'published' })

// Perform a raw update (gives direct access to extra MongoDB update functionality)
const updated = await this.update({ _id: id }, { $inc: { viewCount: 1 } }, { rawUpdate: true })

// Update all documents which match a query
const updated = await this.updateMany({ status: 'draft' }, { status: 'archived' })
```

### Deleting documents

```javascript
// Remove a single document. Returns the deleted document
const deleted = await this.delete({ _id: '507f1f77bcf86cd799439011' })

// Remove multiple documents. Returns an array of deleted documents
const deleted = await this.deleteMany({ status: 'archived' })
```


### Options reference

The following options can be specified when using the above functions. If the option relates to specific functions, this has been noted.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `schemaName` | String | Schema to validate against (defaults to module's schema) |
| `collectionName` | String | Collection to operate on (defaults to module's collection) |
| `validate` | Boolean | Whether to validate data (default: `true`) |
| `invokePreHook` | Boolean | Whether to invoke pre-operation hooks (default: `true`) |
| `invokePostHook` | Boolean | Whether to invoke post-operation hooks (default: `true`) |
| `rawUpdate` | Boolean | **For `update`/`updateMany`**: pass data directly to MongoDB without wrapping in `$set` |
| `strict` | Boolean | **For `findOne`**: throw error if no document found (default: `true`) |

### Lifecycle hooks

In addition to the CRUD functions, `AbstractApiModule` provides hooks that allow you to intercept and modify data at various points. These hooks are accessible both internally and externally (i.e. from other modules).

For more detail on the hook system, see this [page](hooks).

| Hook | Parameters | Mutable | Description |
| ---- | ---------- | :-----: | ----------- |
| `preInsertHook` | `(data, options, mongoOptions)` | Yes | Before insert |
| `postInsertHook` | `(doc)` | No | After insert |
| `preUpdateHook` | `(originalDoc, newData, options, mongoOptions)` | Yes | Before update |
| `postUpdateHook` | `(originalDoc, updatedDoc)` | No | After update |
| `preDeleteHook` | `(doc, options, mongoOptions)` | No | Before delete |
| `postDeleteHook` | `(doc)` | No | After delete |

### Examples

```javascript
// INTERNAL: Modify data before insert
this.preInsertHook.tap(data => {
  data.createdAt = new Date()
})

// EXTERNAL: React after insert
mymodule.postInsertHook.tap(doc => {
  this.log('info', `mymodule created document ${doc._id}`)
})
```

---

## Using MongoDBModule directly

For operations not covered by `AbstractApiModule`, use the MongoDB module directly.

Note that this module follows the MongoDB Node.js driver API fairly closely. As such, there are some (less user-friendly) differences between the functions found in `AbstractApiModule`.

**Warning:** the `mongodb` module provides low-level access to the database, and does not perform any tasks such as data validation. Proceed with caution.

### Accessing the mongodb module

```javascript
const mongodb = await this.app.waitForModule('mongodb')
```

### Inserting documents

```javascript
const doc = await mongodb.insert('users', { email: 'user@example.com', name: 'Test User' })
```

### Querying documents

```javascript
// Find all
const allUsers = await mongodb.find('users')

// Find with query
const user = await mongodb.find('users', { email: 'user@example.com' })

// Find with options
const page = await mongodb.find('users', {}, { limit: 10, skip: 20, sort: { createdAt: -1 }})
```

### Updating documents

```javascript
// Update a single document
const updated = await mongodb.update('users', { _id: '507f1f77bcf86cd799439011' }, { $set: { name: 'Updated Name' } })

// Update multiple documents
const updated = await mongodb.updateMany('users', { role: 'guest' }, { $set: { active: false } })

// Replace an entire document
const replaced = await mongodb.replace('users', { _id: '507f1f77bcf86cd799439011' }, { ...data })
```

### Deleting documents

```javascript
// Remove a single document
await mongodb.delete('users', { _id: '507f1f77bcf86cd799439011' })

// Removing multiple documents
await mongodb.deleteMany('users', { active: false })
```

### Advanced operations

For aggregation pipelines and other advanced features, access the underlying driver:

```javascript
// Get a collection reference
const collection = mongodb.getCollection('users')

// Aggregation pipeline
const results = await collection.aggregate([
  { $match: { active: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]).toArray()

// Database statistics
const stats = await mongodb.client.db().stats()
```

### Working with ObjectIds

The module automatically converts string IDs to ObjectIds. You can also work with them directly:

```javascript
// Create a new ObjectId
const id = mongodb.ObjectId.create()

// Check if a string is valid
const isValid = mongodb.ObjectId.isValid('507f1f77bcf86cd799439011')

// Parse a string to ObjectId
const objectId = mongodb.ObjectId.parse('507f1f77bcf86cd799439011')
```

### Indexes

Set indexes for better query performance:

```javascript
// Simple unique index
await mongodb.setIndex('users', 'email', { unique: true })

// Compound index
await mongodb.setIndex('content', { courseId: 1, type: 1 })
```

See the [MongoDB Node.js driver documentation](https://mongodb.github.io/node-mongodb-native/) for the full driver API.

---

## Error handling

Common database errors:

| Error | Description |
| ----- | ----------- |
| `MONGO_CONN_FAILED` | Failed to connect to the database |
| `MONGO_DUPL_INDEX` | Duplicate key violation (unique index) |
| `MONGO_IMMUTABLE_FIELD` | Attempted to modify an immutable field |
| `INVALID_OBJECTID` | Invalid ObjectId string format |
| `NOT_FOUND` | Document not found (AbstractApiModule only) |
| `TOO_MANY_RESULTS` | Multiple documents found when one expected |

```javascript
try {
  await this.insert({ email: 'existing@example.com' })
} catch (e) {
  if (e.code === 'MONGO_DUPL_INDEX') {
    // Handle duplicate
  }
}
```
