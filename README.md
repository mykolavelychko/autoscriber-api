# Autoscriber API

This project is an API for managing recordings and recording chunks using Express, Apollo Server, and SQLite.

## Description

The Autoscriber API allows you to create, update, and retrieve recordings and their associated chunks. It uses SQLite as the database and provides a GraphQL interface for interacting with the data.

## Installation

Clone the repository:

    git clone <repository-url>
    cd autoscriber-api

Install dependencies:
    npm install

## Usage

Start the server:

```sh
npm start
```

The server will be running at http://localhost:4000/graphql.

## API Endpoints

### Queries

- `recording(id: ID!): Recording`: Retrieve a single recording by its ID.
- `recordings: [Recording]`: Retrieve all recordings.
- `chunks(parentId: ID): [RecordingChunk]`: Retrieve all chunks for a given recording ID.
- `chunk(id: ID!): RecordingChunk`: Retrieve a single chunk by its ID.

### Mutations

- `createRecording(name: String!): Recording`: Create a new recording with the given name.
- `updateRecording(id: ID!, name: String, data: String): Recording`: Update an existing recording's name and data.
- `createChunk(parentId: ID!, data: String!): RecordingChunk`: Create a new chunk for a given recording ID with the provided data.

## License

This project is licensed under the MIT License.
