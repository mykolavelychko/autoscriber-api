const express = require("express");
const bodyParser = require("body-parser");
const { ApolloServer, gql } = require("apollo-server-express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// TODO: move to a separate file
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run(
    "CREATE TABLE recordings (id INTEGER PRIMARY KEY, name TEXT, data BLOB, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );
  db.run(
    "CREATE TABLE recording_chunks (id INTEGER PRIMARY KEY, parentId INTEGER, data BLOB, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(parentId) REFERENCES recordings(id))"
  );
});

// TODO: move to a separate file
const typeDefs = gql`
  scalar Upload

  type Recording {
    id: ID!
    name: String!
    timestamp: String!
    data: String
  }

  type RecordingChunk {
    id: ID!
    timestamp: String!
    parentId: ID!
    data: String!
  }

  type Query {
    recording(id: ID!): Recording
    recordings: [Recording]
    chunks(parentId: ID): [RecordingChunk]
    chunk(id: ID!): RecordingChunk
  }

  type Mutation {
    createRecording(name: String!): Recording
    updateRecording(id: ID!, name: String, data: String): Recording
    createChunk(parentId: ID!, data: String!): RecordingChunk
  }
`;

// TODO: move to a separate file
const resolvers = {
  Query: {
    // TODO: add pagination
    recordings: () => {
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT id, name, timestamp, data FROM recordings",
          [],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });
    },
    recording: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM recordings WHERE id = ?", [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    },
    chunks: (_, { parentId }) => {
      return new Promise((resolve, reject) => {
        let query =
          "SELECT id, parentId, timestamp, data FROM recording_chunks";
        let params = [];

        if (parentId) {
          query += " WHERE parentId = ?";
          params.push(parentId);
        }

        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
    chunk: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM recording_chunks WHERE id = ?",
          [id],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });
    },
  },
  Mutation: {
    createRecording: async (_, { name }) => {
      return new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO recordings (name) VALUES (?)",
          [name],
          function (err) {
            if (err) {
              reject(err);
            } else {
              db.get(
                "SELECT * FROM recordings WHERE id = ?",
                [this.lastID],
                (err, row) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            }
          }
        );
      });
    },
    updateRecording: async (_, { id, name, data }) => {
      return new Promise((resolve, reject) => {
        let updateQuery = "UPDATE recordings SET";
        const params = [];
        if (name) {
          updateQuery += " name = ?,";
          params.push(name);
        }
        if (data) {
          updateQuery += " data = ?,";
          params.push(data);
        }
        updateQuery = updateQuery.slice(0, -1); // Remove the trailing comma
        updateQuery += " WHERE id = ?";
        params.push(id);

        db.run(updateQuery, params, function (err) {
          if (err) {
            reject(err);
          } else {
            db.get(
              "SELECT * FROM recordings WHERE id = ?",
              [id],
              (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(row);
                }
              }
            );
          }
        });
      });
    },
    createChunk: async (_, { parentId, data }) => {
      return new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO recording_chunks (parentId, data) VALUES (?, ?)",
          [parentId, data],
          function (err) {
            if (err) {
              reject(err);
            } else {
              db.get(
                "SELECT * FROM recording_chunks WHERE id = ?",
                [this.lastID],
                (err, row) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            }
          }
        );
      });
    },
  },
};

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  const port = 4000;
  await server.start();
  server.applyMiddleware({ app });
  app.listen(port, () => {
    console.log(
      `Server is running on http://localhost:${port}${server.graphqlPath}`
    );
  });
}

startServer();
