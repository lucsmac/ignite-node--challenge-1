const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find(user => user.username === username)
  if(!user) return response.status(404).json({ error: 'User not found'})

  request.user = user

  return next()
}

function getTodo(request, response, next) {
  const { user } = request
  const { id } = request.params

  const todoIndex = user.todos.findIndex(todo => todo.id === id)
  if (todoIndex === -1) return response.status(404).json({ error: 'Todo not found'})

  request.todo = {
    index: todoIndex,
    content: user.todos[todoIndex]
  }

  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userAlreadyExists = users.some(user => user.username === username)
  if(userAlreadyExists) return response.status(400).json({ error: 'User already exists'})

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { user } = request

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  
  user.todos.push(todo)

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, getTodo, (request, response) => {
  const { title, deadline } = request.body
  const { user } = request
  const { index: todoIndex, content: oldTodo } = request.todo 

  const newTodo = { ...oldTodo, title, deadline: new Date(deadline) }
  user.todos[todoIndex] = newTodo

  return response.json(newTodo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, getTodo, (request, response) => {
  const { user } = request
  const { index: todoIndex, content: oldTodo } = request.todo 

  const newTodo = { ...oldTodo, done: true }
  user.todos[todoIndex] = newTodo
  
  return response.json(newTodo)
});

app.delete('/todos/:id', checksExistsUserAccount, getTodo, (request, response) => {
  const { user } = request
  const { content: todo } = request.todo 

  user.todos.splice(todo, 1)

  return response.status(204).send()
});

module.exports = app;