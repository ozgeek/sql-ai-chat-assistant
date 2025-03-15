# SQL AI Chat Assistant

![SQL AI Chat Assistant Logo](images/logo.png)

A command-line interface (CLI) chat assistant that helps users interact with PostgreSQL databases using natural language, powered by AI (OpenAI).

**Please notice that this assistant is just sample to showcase AI capabilities. Its not ready for production**

**If you use it on production, its on your own risk !**

## Youtube Video

[![](https://img.youtube.com/vi/ii1Xq0wVd-o/0.jpg)](https://www.youtube.com/watch?v=ii1Xq0wVd-o)

[https://www.youtube.com/watch?v=ii1Xq0wVd-o&t=2s&pp=0gcJCUUJAYcqIYzv](https://www.youtube.com/watch?v=ii1Xq0wVd-o)

## Features

- 🤖 Natural language interactions with your database
- 🔍 Smart SQL query generation
- 🎨 Formatted Markdown output in terminal
- 🔒 Secure password input
- 📝 Query validation and safety checks
- 💡 Best practices suggestions

## Capabilities

This assistant showcases the capabilities of AI to interact with a database using natural language, I belive it can easly responds to your questions, even the most complex ones.

You dont need to be a SQL expert, this assistant can understand your questions and generate the appropriate SQL query for you.

It can be helful in debuggig, learning, understanding the database, or also consuming it with a CLI interface, no need to a CRUD interface !

Heres a list of its capabilities that I tested :

|capabilities|Samples|
|---|---|
|Database schema operation|Ask him to generate you a Todolist application database, then to add new columns, or even remove columns, or even update the whole database schema|
|Searching and selecting|Ask him to search data from a specific table without using the right table name or column names, he will find the right table and column names and generate the appropriate SQL query|
|Creating and generating|Ask him to randomly generate Ten users with random English names|
|Calculating and comparing|Ask him to compare the number of users based on their gender, or location, or even the number of users who are active or not, or the number of users who are premium users or not|
|Context remembering|Tell him that you consider OPTIN = True as a customer is subscribed to a newsletter, then ask him to generate you a query to get the number of subscribed customers every month|


## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git https://github.com/ozgeek/sql-ai-chat-assistant.git
cd sql-ai-chat-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key_here
```

4. You will maybe need to install a postgres database if you dont have one, or simply run a basic postgres database using docker:

```bash
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -d postgres
```


## Usage

1. Start the application:

```bash
npm run start
```

2. Enter your database connection details when prompted:
   - Host (default: localhost)
   - Database name
   - Username
   - Password
   - Port (default: 5432)

3. Start chatting with the AI assistant! Example queries:
   - Show me all tables in the database
   - Show me the count of records of every table
   - Create a todolist application database
   - Create 10 random users
   ...

## Contributing

You can also contribute by giving me feedbacks, or by suggesting new features.

I am interested in knowing your thoughts about this project, and how it can be improved. The pain point that an AI SQL assistant should solve, and how it can be improved.

Write me on zarga.oussama@gmail.com, or create an issue on the repository.

Thanks for your time and feedbacks !

## License

This project is licensed under the MIT License.

## Author

Oussama Zarga (zarga.oussama@gmail.com)| LinkedIn: https://www.linkedin.com/in/oussama-zarga-096a2746/

