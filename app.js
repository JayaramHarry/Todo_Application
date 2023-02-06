const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const hasPriorityStatusAndProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1

app.get("/todos", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityStatusAndProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}'
            AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE status = '${status}';`;
      break;
    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await database.all(getTodoQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT * FROM todo
    WHERE id = '${todoId}';`;
  const list = await database.get(getTodoIdQuery);
  response.send(convertDbObjectToResponseObject(list));
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO todo(id, todo, priority, status)
    VALUES ('${id}', '${todo}', '${priority}', '${status}');`;
  data = await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";

  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const getPreviousQuery = `
    SELECT
     * 
    FROM 
    todo
    WHERE id = '${todoId}';`;
  const previousTodo = await database.get(getPreviousQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateTodoQuery = `
  UPDATE 
  todo
  SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE id = '${todoId}';`;
  await database.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
     DELETE FROM todo
     WHERE id = '${todoId}';`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
