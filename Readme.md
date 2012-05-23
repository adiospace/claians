# Claians

Example of a simple one-page app for managing clients.


## Install And run

Make sure you have the latest `MongoDB`, `Node.js` and `npm` installed and ready to use.

**Then:**

    cd app
    npm install
    node app.js


## API

The app uses a JSON based REST API. It provides the following methods:

- List clients
- Count clients
- Get client
- Create client
- Update client
- Delete client
- Upload temp images

**General errors:**

    400 Validation failed
    404 Resource not found
    500 Server error


### List clients

Get a list of clients, with options for searching, filtering, sorting, and paging.


#### Returns last 50 clients:

    GET /clients

**Example:** 
  
    curl localhost:3000/clients


#### Search a term in client's title, email or company:

    GET /clients?search={term}

**Example:** 

    curl localhost:3000/clients?search=EnemyInc


#### Filter the list after an attribute:

    GET /clients?{attr}={term}

**Valid attributes:**

`title`, `email`, `company`, `email`

**Example:** 

    curl localhost:3000/clients?title=EnemyInc&email=greatest@enemyinc.com


#### Sort the clients list:

    GET /clients?sort={attr}[:{order}]

**Valid sort attributes:**

`title`, `email`, `dateOfBirth`, `company`

**Valid sort order:**

`asc`, `desc` (default: `asc`)

**Example:**

    curl localhost:3000/clients?sort=title,email:desc,company:asc


#### Paging:

    GET /clients?page={page}[:{perPage}]

**Valid values:**

`page` and `perPage` must be numbers. 

`page` must start from 1.

`perPage` must be smaller or equals with 50. (default: 50)

**Example:**

    curl localhost:3000/clients?page=2:20


### Count clients

    GET /clients/count

**Example:**

    curl localhost:3000/clients/count


### Get client

    GET /clients/:id


Example: 

    curl localhost:3000/clients/4fbd032c36d989ec6f000001


### Create client

    POST /clients

**Valid data:**

`title`, `email`, `dateOfBirth`, `company`, `imageId`

**Notes:**

Get an `imageId` by uploading a temp image. See *Upload temp images* below.

For JSON data, make sure to send the `Content-Type: application/json` header.

**Example:** 

    curl -X POST -d title=enemyInc -d email=small@enemyinc.com \
    -d imageId=4fbd032c36d989ec6f000001 localhost:3000/clients


### Update client

    PUT /clients/:id

**Valid data:**

`title`, `email`, `dateOfBirth`, `company`, `imageId`

**Notes:**

Get an `imageId` by uploading a temp image. See *Upload temp images* below.

For JSON data, make sure to send the `Content-Type: application/json` header.


**Example:** 

    curl -X PUT -d title=enemyInc -d email=small@enemyinc.com \
    -d imageId=4fbd032c36d989ec6f000001 localhost:3000/clients/4fbd032c36d989ec6f000001


### Delete client

    DELETE /clients/:id

**Example:**

    curl -X DELETE localhost:3000/clients/4fbd032c36d989ec6f000001


### Upload temp images

    POST /images

**Valid data:**

`image`

**Note:** 

Post with `Content-Type: multipart/form-data`.

**Example:**

    curl -F image=@someimagefile.jpg localhost:3000/images
