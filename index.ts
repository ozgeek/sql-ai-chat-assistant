/**
 * Sql Chat Assistant
 * 
 * This is a simple chat assistant that uses the OpenAI API to interact with a local PostgreSQL database.
 * It allows you to ask questions about the database and get answers, update the database, create new tables, make calculations, etc.
 * 
 */

import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { OpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions/completions";
import * as dotenv from 'dotenv';
import { DatabaseService, DatabaseConfig } from './database';
import { COLORS, INITIAL_CHAT_MESSAGE, SQL_ASSISTANT_PROMPT, DATABASE_TOOLS, OPENAI_CONFIG } from './config';
import { marked } from 'marked';
import { LoadingSpinner } from './spinner';
import TerminalRenderer from 'marked-terminal';

// Load environment variables
dotenv.config();


const aiChat = async () => {
  // Configure marked with the terminal renderer before using it
  marked.setOptions({
    // @ts-ignore (due to type mismatch between marked and marked-terminal)
    renderer: new TerminalRenderer({
      tableOptions: {
        chars: {
          'top': '─',
          'top-mid': '┬',
          'top-left': '┌',
          'top-right': '┐',
          'bottom': '─',
          'bottom-mid': '┴',
          'bottom-left': '└',
          'bottom-right': '┘',
          'left': '│',
          'left-mid': '├',
          'mid': '─',
          'mid-mid': '┼',
          'right': '│',
          'right-mid': '┤',
          'middle': '│'
        }
      },
      emoji: false,
      strong: (text: string) => `\x1b[1m${text}\x1b[0m`, // Bold
      em: (text: string) => `\x1b[3m${text}\x1b[0m`,     // Italic
      list: (body: string) => {
        // Process bold text in lists
        return body.replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m');
      },
      listitem: (text: string) => {
        // Process bold text in list items
        const processed = text.replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m');
        return `  • ${processed}\n`;
      }
    })
  });

  // Create readline interface with special handling for password
  const rl = readline.createInterface({ 
    input, 
    output,
    terminal: true 
  });

  // Function to ask question and return promise
  const askQuestion = (query: string) => new Promise((resolve) => rl.question(query, resolve));

  // Function to ask password with masking
  const askPassword = () => {
    return new Promise<string>((resolve) => {
      let password = '';
      console.log('Enter password (press Enter to skip): ');
      
      // Handle raw input
      process.stdin.setRawMode(true);
      process.stdin.on('data', (data) => {
        const char = data.toString();
        
        // Handle enter
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          console.log('');
          resolve(password);
          return;
        }
        
        // Handle backspace
        if (char === '\u0008' || char === '\u007f') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          return;
        }
        
        // Add char to password and print *
        password += char;
        //process.stdout.write('*');
        process.stdout.write('\b \b*'); // Move back, clear the character, move back, write asterisk
      });
    });
  };

  try {
    console.log('Welcome to Sql Chat Assistant! Please enter your PostgreSQL database connection details:');
    const config: DatabaseConfig = {
      host: (await askQuestion('Host (default: localhost): ')) as string || 'localhost',
      database: await askQuestion('Database name: ') as string,
      user: await askQuestion('Username: ') as string,
      password: await askPassword() as string || '',
      port: parseInt(await askQuestion('Port (default: 5432): ') as string || '5432'),
    };

    const dbService = new DatabaseService(config);

    // Test connection
    try {
      await dbService.testConnection();
      console.log(COLORS.green + 'Database connection successful!' + COLORS.reset);
    } catch (error) {
      console.error(COLORS.red + 'Failed to connect to database:' + COLORS.reset, error);
      process.exit(1);
    }

    // Continue with chat interface
    console.log(`Hello ${config.user}! Start chatting with the database ${config.database} (type 'exit' to quit, 'history' to see chat history)`);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Keep track of chat history
    const chatHistory: ChatCompletionMessageParam[] = [INITIAL_CHAT_MESSAGE];
    let databaseSchema: string | undefined = await dbService.exportSchema();

    // Set assistant prompt
    let assistant = SQL_ASSISTANT_PROMPT(databaseSchema);
    const loader = new LoadingSpinner('Thinking ');
    loader.start();
    const startupmessage = await openai.chat.completions.create({
      ...OPENAI_CONFIG,
      messages: [{role: 'system', content: assistant}, ...chatHistory],
      tools: DATABASE_TOOLS,
    });
    loader.stop();

    // Update the console.log statements to use marked
    const printMarkdown = (text: string) => {
      // Remove color codes before parsing markdown, then reapply them
      const cleanText = text.replace(COLORS.green, '').replace(COLORS.reset, '');
      console.log(COLORS.green + marked.parse(cleanText) + COLORS.reset);
    };

    // Replace console.log with printMarkdown for AI responses
    printMarkdown(startupmessage.choices[0].message.content!);
    chatHistory.push(startupmessage.choices[0].message); // append model's function call message
    // Start chat loop
    rl.on('line', async (input) => {
        // Handle commands
        switch(input.toLowerCase()) {
            case 'exit':
                console.log('Goodbye!');
                rl.close();
                return;
                
            case 'history':
                console.log('\n=== Chat History ===');
                chatHistory.forEach(entry => {
                    console.log(`- ${entry.role}: ${entry.content}`);
                });
                console.log('===================\n');
                return;
                
            default:
                try {
                  loader.start();
                  chatHistory.push({
                    role: 'user',
                    content: input
                  });
                  
                  const completion = await openai.chat.completions.create({
                    ...OPENAI_CONFIG,
                    messages: [{role: 'system', content: assistant}, ...chatHistory],
                    tools: DATABASE_TOOLS,
                  });

                  loader.stop();
                  
                  if (completion.choices[0].message.content) {
                    printMarkdown(completion.choices[0].message.content);
                  }

                  chatHistory.push(completion.choices[0].message);

                  // If there are tool calls, update the loader message
                  if (completion.choices[0].message.tool_calls) {
                    loader.setMessage('Querying database ');
                    loader.start();
                    
                    // Sequential processing of tool calls
                    for (const toolCall of completion.choices[0].message.tool_calls) {
                      const toolName = toolCall.function.name;
                      const toolArgs = JSON.parse(toolCall.function.arguments);
                      try {
                        console.log(COLORS.blue + `Querying database: ${toolArgs.sql_query}` + COLORS.reset);
                        const result = await dbService.query(toolArgs.sql_query);
                        loader.stop();
                        loader.setMessage('Thinking ');
                        loader.start();
                        const resultString = JSON.stringify({
                          rows: result.rows,
                          fields: result.fields,
                          rowCount: result.rowCount,
                          command: result.command
                        });

                        if (['ALTER', 'CREATE'].includes(result.command)) {
                          databaseSchema = await dbService.exportSchema();
                          assistant = SQL_ASSISTANT_PROMPT(databaseSchema);
                          console.log(COLORS.blue + 'Database schema updated' + COLORS.reset);
                        }
                        chatHistory.push({
                          role: "tool",
                          tool_call_id: toolCall.id,
                          content: resultString
                        });
                      } catch (error) {
                        chatHistory.push({
                          role: "tool",
                          tool_call_id: toolCall.id,
                          content: "Error querying database: " + error
                        });
                      }
                    }
                    const completion2 = await openai.chat.completions.create({
                      ...OPENAI_CONFIG,
                      messages: [{role: 'system', content: assistant}, ...chatHistory],
                      tools: DATABASE_TOOLS,
                  });
                  loader.stop();
                  //console.log(completion2);
                  if (completion2.choices[0].message.content) {
                    printMarkdown(completion2.choices[0].message.content);
                  }
                  }  
                } catch (error) {
                  loader.stop();
                  console.error('Error:', error);
                }

        }
    });

    // Handle cleanup
    rl.on('close', () => {
        process.exit(0);
    });
  } catch (error) {
    console.error('Error in Sql Chat Assistant:', error);
    process.exit(1);
  }
}

aiChat();