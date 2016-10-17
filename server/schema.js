import * as _ from 'underscore';

import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLNonNull
} from 'graphql';

const mongo = require('promised-mongo');
// You can use any MONGO_URL here, whether it's locally or on cloud.
const db = mongo('mongodb://localhost/mydb');
const authorsCollection = db.collection('authors');
const postsCollection = db.collection('posts');
const commentsCollection = db.collection('comments');

const Author = new GraphQLObjectType({
  name: 'Author',
  description: 'Represent the type of an author of a blog post or a comment',
  fields: () => ({
    _id: {type: GraphQLString},
    name: {type: GraphQLString}
  })
});

const Comment = new GraphQLObjectType({
  name: 'Comment',
  description: 'Comment on the blog post',
  fields: () => ({
    _id: {type: GraphQLString},
    content: {type: GraphQLString},
    author: {
      type: Author,
      resolve: function(comment) {
        return authorsCollection.findOne({
          _id: comment.author
        })
      }
    },
    post: {type: new GraphQLNonNull(GraphQLString)}
  })
});

const Post = new GraphQLObjectType({
  name: "Post",
  description: "Blog post content",
  fields: () => ({
    _id: {type: GraphQLString},
    title: {type: GraphQLString},
    bodyContent: {type: GraphQLString},
    author: {
      type: Author,
      resolve: function(post) {
        return authorsCollection.findOne({
          _id: post.author
        })
      }
    },
    comments: {
      type: new GraphQLList(Comment),
      resolve: function(post) {
        return commentsCollection.find({
          post: post._id
        }).toArray();
      }
    }
  })
});

const Query = new GraphQLObjectType({
  name: 'BlogSchema',
  description: "Root of the Blog Schema",
  fields: () => ({
    posts: {
      type: new GraphQLList(Post),
      description: "List of posts in the blog",
      resolve: function(source, {category}) {
        return postsCollection.find().toArray();
      }
    },
    comments: {
      type: new GraphQLList(Comment),
      description: "List of Comments",
      resolve: function(){
        return commentsCollection.find().toArray();
      }
    },
    authors: {
      type: new GraphQLList(Author),
      description: "List of Authors",
      resolve: function(){
        return authorsCollection.find().toArray();
      }
    },
    author: {
      type: Author,
      description: "Get Author by id",
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: function(source, args) {
        return authorsCollection.findOne({
          _id: args.id
        })
      }
    }
  })
});

const Mutation = new GraphQLObjectType({
  name: "Mutations",
    fields: {
        createAuthor: {
	      type: Author,
        args: {
            _id: {type: new GraphQLNonNull(GraphQLString)},
	          name: {type: new GraphQLNonNull(GraphQLString)}
		    },
        resolve: function(rootValue, args) {
	        let author = Object.assign({}, args);
		        return authorsCollection.insert(author)
          .then(_ => author);
	        }
		    },
        createPost: {
          type: Post,
          args: {
            _id: {type: new GraphQLNonNull(GraphQLString)},
            title: {type: GraphQLString},
            bodyContent: {type: GraphQLString},
            author: {type: new GraphQLNonNull(GraphQLString), description: "Id of the author"}
          },
          resolve: function(rootValue, args) {
            let post = Object.assign({}, args);
            return postsCollection.insert(post).then(_ => post);
          }
        },
        createComment: {
          type: Comment,
          args: {
            _id: {type: new GraphQLNonNull(GraphQLString)},
            content: {type: GraphQLString},
            author:  {type: new GraphQLNonNull(GraphQLString), description: "Id of the author"},
            post:  {type: new GraphQLNonNull(GraphQLString), description: "Id of the post"}
          },
          resolve: function(rootValue, args) {
            let comment = Object.assign({}, args);
            return commentsCollection.insert(comment).then(_ => comment);
          }
        }
    }
});

const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
});

export default Schema;
