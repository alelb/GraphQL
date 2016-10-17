//require('babel-core/register');
var express = require('express');
var graphql = require('graphql');
var expressGraphql = require('express-graphql');
var Schema = require('./static/schema.js').default;

var app = express();

app.use('/', expressGraphql({
  schema: Schema,
  graphiql: true
}));

app.listen(3000);
console.log('GraphQL Sandbox started on port: 3000');
