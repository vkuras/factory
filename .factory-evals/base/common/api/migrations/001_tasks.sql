CREATE TABLE tasks (
  id serial PRIMARY KEY,
  title varchar(100) NOT NULL CHECK (length(trim(title)) > 0),
  due_date date NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_open_due_idx ON tasks (done, due_date);
