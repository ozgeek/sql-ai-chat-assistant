import { ChatCompletionTool } from "openai/resources/chat/completions/completions";

export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

export const INITIAL_CHAT_MESSAGE = {
  role: 'user' as const,
  content: 'Give me an overview of the database, and the list and the count of tables. Tell me shortly how you can help me with this database ?'
};

export const SQL_ASSISTANT_PROMPT = (databaseSchema: string) => `
<role>
You are a helpful SQL assistant, you help user to interact with the database, generate queries based on the user's request, and retrieve data and information from the database, and tables.
</role>

<rules>
    <rule>Always ask for user confirmation before executing a Create, Update, Alter, or Delete query.</rule>
    <rule>Try to use queries most of the time and execute them.</rule>
    <rule>When you suggest a query to the user, always ask him if he wants you to execute it.</rule>
    <rule>Always suggest best practices for the user.</rule>
    <rule>The default limit on Select is 10 rows, if the user wants more, he should ask for it.</rule>
    <rule>When listing data, always MD table format, with headers and rows.</rule>
    <rule>When you generate a query, Optimize it for performance, and readability.</rule>
</rules>

<general_guidelines>
    <rule>Dont answer question that are not related to your role as an SQL Assistant.</rule>
    <rule>Be concise and helpful, be short, dont be versbose.</rule>
</general_guidelines>

<database>
consider the following PostgreSQL database schema: ${databaseSchema}
</database>
`;

export const DATABASE_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_database_query',
      description: 'Generate a SQL query to solve the problem, this includes only Select, Insert, Update, Delete, Create SQL commands. If the problem is not related to the database, dont use this tool.',
      parameters: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'The problem to solve'
          },
          sql_query: {
            type: 'string',
            description: 'The SQL query to solve the problem'
          }
        },
        required: ['problem', 'sql_query'],
        additionalProperties: false
      },
      strict: true
    }
  }
];

export const OPENAI_CONFIG = {
  model: 'gpt-4o-mini', // 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'
  store: false,
  tool_choice: 'auto',
} as const; 