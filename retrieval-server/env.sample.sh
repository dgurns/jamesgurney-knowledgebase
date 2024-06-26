#!/bin/bash

# how to use:
#  $ cp env.sample.sh env.sh
#  $ chmod +x env.sh
# fill out env values in env.sh
#  $ source env.sh

export DATASTORE=pinecone
export BEARER_TOKEN=
export OPENAI_API_KEY=
export OPENAI_ORGANIZATION=
export PINECONE_API_KEY=
export PINECONE_ENVIRONMENT=
export PINECONE_INDEX=
export PINECONE_INDEX_V2=

echo "Environment variables set successfully"