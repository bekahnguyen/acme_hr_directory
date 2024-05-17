const pg = require("pg");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

app.use(express.json());
app.use(require("morgan")("dev"));

//routes
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM departments
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO employees(name, department_id)
    VALUES($1, $2)
    RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE FROM employees 
    WHERE id= $1`;
    const response = await client.query(SQL, [req.params.id]);
    {
      res.sendStatus(204);
    }
  } catch (error) {
    next(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name=$1, created_at=now(), updated_at=now(), department_id=$2
    WHERE id=$3
    RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    {
      res.send(response.rows[0]);
    }
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

const init = async () => {
  await client.connect();
  let SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) 
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    )`;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
  INSERT into departments(name) VALUES('SALES');
  INSERT INTO departments(name) VALUES('IT');
  INSERT into departments(name) VALUES('ACCOUNTING');
  INSERT into departments(name) VALUES('HR');

  INSERT into employees(name, department_id) VALUES('Jay',
  (SELECT id FROM departments WHERE name='SALES'));
  INSERT into employees(name, department_id) VALUES('Kay',
  (SELECT id FROM departments WHERE name='HR'));
  INSERT into employees(name, department_id) VALUES('Elle',
  (SELECT id FROM departments WHERE name='IT'));
  INSERT into employees(name, department_id) VALUES('Emme',
  (SELECT id FROM departments WHERE name='ACCOUNTING'));
  `;
  await client.query(SQL);
  console.log("data seeded");
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
