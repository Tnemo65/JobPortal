import { OpenAI } from "openai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find and load .env file at multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),              // Project root
  path.resolve(__dirname, '../.env'),                 // backend folder
  path.resolve(process.cwd(), '.env'),                // Current working directory
  path.resolve(process.cwd(), 'backend/.env')         // backend subfolder from current dir
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('No .env file found. Tried these paths:');
  envPaths.forEach(p => console.log(` - ${p}`));
  console.log('Falling back to environment variables only');
}

const apiKey = process.env.OPENAI_API_KEY;

async function testOpenAIKey() {
  console.log("Testing OpenAI API Key...");
  console.log(`Key format: ${maskApiKey(apiKey)}`);
  
  if (!apiKey) {
    console.error("❌ ERROR: OPENAI_API_KEY is not defined in environment variables");
    console.log("Available environment variables:", Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')).join(', '));
    return;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Make a simple request to check if the API key works
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" }
      ],
      max_tokens: 20
    });
    
    console.log("✅ SUCCESS: OpenAI API key is working correctly!");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ ERROR: OpenAI API key test failed");
    
    if (error.status === 401) {
      console.error("Authentication error: Your API key is invalid or has been revoked");
    } else if (error.status === 429) {
      console.error("Rate limit error: You've exceeded your rate limit or your account has insufficient quota");
    } else {
      console.error("Error details:", error.message);
    }
    
    // Log more details in development
    if (process.env.NODE_ENV !== 'production') {
      console.error("Full error:", error);
    }
  }
}

// Utility function to mask the API key for logging
function maskApiKey(key) {
  if (!key) return "undefined";
  
  // For OpenAI keys, we want to preserve the prefix (like "sk-") and show the last 4 chars
  const prefix = key.substring(0, 3);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix} (length: ${key.length} characters)`;
}

// Run the test
testOpenAIKey();
