import inquirer from 'inquirer';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const questions = [
  {
    type: 'input',
    name: 'openaiApiKey',
    message: 'Please enter your OpenAI API key:',
    validate: input => input.startsWith('sk-') || 'Please enter a valid OpenAI API key (starts with sk-)'
  }
];

async function createEnvFile(answers) {
  // Changed OPENAI_API_KEY to VITE_OPENAI_API_KEY to match what's expected in the service
  const envContent = `VITE_OPENAI_API_KEY=${answers.openaiApiKey}\n`;
  await fs.writeFile('.env', envContent);
  console.log('✅ Created .env file with API key');
}

async function installDependencies() {
  console.log('📦 Installing dependencies...');
  try {
    await execAsync('npm install');
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Error installing dependencies:', error);
    process.exit(1);
  }
}

async function setup() {
  console.log('🚀 Setting up Campaign Report Generator\n');

  try {
    const answers = await inquirer.prompt(questions);
    await createEnvFile(answers);
    await installDependencies();

    console.log('\n✨ Setup completed successfully! You can now run:');
    console.log('\nnpm run dev');
    console.log('\nto start the development server.');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();