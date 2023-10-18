const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();

app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDataBaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running on http://localhost:3000/");
    });
  } catch (err) {
    console.log(`${err.message}`);
    process.exit(1);
  }
};
initializeDataBaseAndServer();

const haspriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let result = null;
  let query = null;
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasStatus(request.query):
      query = `
      SELECT
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasPriority(request.query):
      query = `
            SELECT * FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND priority='${priority}';
            `;
      break;
    case haspriorityAndStatus(request.query):
      query = `
            SELECT * FROM 
            todo
            WHERE todo LIKE '%${search_q}%'
            AND priority='${priority}'
            AND status='${status}';
            `;
      break;
    default:
      query = `
            SELECT * FROM 
            todo
            WHERE todo LIKE '%${search_q}%';
            `;
      break;
  }

  result = await db.all(query);
  response.send(result);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosWithStatusQuery = `
         SELECT
          *
         FROM
         todo
         WHERE id=${todoId};
    `;
  const booksList = await db.get(getTodosWithStatusQuery);
  response.send(booksList);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
       INSERT INTO todo(id,todo,priority,status)
       VALUES(${id},'${todo}','${priority}','${status}');
    `;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedCol = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedCol = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedCol = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedCol = "Todo";
      break;
  }
  const previousTodoQuery = `
      SELECT * FROM todo
      WHERE todoId=${todoId};
  `;
  const previousTodo = await app.get(previousTodoQuery);
  const {
    status = previousTodo.status,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
  } = request.body;
  const updateQuery = `
        UPDATE todo
        SET status='${status}',
        todo='${todo}',
        priority='${priority}'
        WHERE id=${todoId};
    `;
  await db.run(updateQuery);
  response.send(`${updatedCol} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
         DELETE FROM todo
         WHERE todoId=${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
